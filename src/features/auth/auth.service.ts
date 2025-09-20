import { Inject, Injectable } from "@nestjs/common";
import { IAuthService } from "./interfaces/service";
import {
  LoginPayload,
  RegisterPayload,
  ResendVerificationCodePayload,
  VerifyRegisterPayload,
  VerifyTwoFactorPayload,
} from "./dto";
import { ACCOUNT_TYPE, DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { getElapsedTime } from "src/utils/elapsed-time";
import * as argon2 from "argon2";
import {
  IPendingUser,
  IUser,
  PendingUserTable,
  TwoFactorBackupInsertForm,
  TwoFactorBackupTable,
  TwoFactorSecretTable,
  UserTable,
} from "src/drizzle/schemas";
import { AuthUtilService } from "./util.service";
import { RESEND_CODE_COOLDOWN } from "./constants";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { eq } from "drizzle-orm";
import { Response } from "express";
import * as otplib from "otplib";
import { toDataURL } from "qrcode";
import { randomBytes } from "node:crypto";
import * as Cryptr from "cryptr";

@Injectable()
export class AuthService implements IAuthService {
  private cryptr: Cryptr;

  constructor(
    @Inject(DATABASE) private db: Database,
    @AuthConfig() private authConfig: IAuthConfig,
    private authUtilService: AuthUtilService,
  ) {
    this.cryptr = new Cryptr(this.authConfig.hashMasterKey);
  }

  async register(payload: RegisterPayload): Promise<string> {
    const user = await this.db.query.UserTable.findFirst({
      where: (table, funcs) => funcs.eq(table.email, payload.email),
      columns: {
        id: true,
      },
    });
    if (user) {
      throw new LinaError(LinaErrorType.EMAIL_ALREADY_EXISTS);
    }

    let pendingUser:
      | IPendingUser
      | Pick<IPendingUser, "id" | "createdAt" | "email">
      | undefined;
    pendingUser = await this.db.query.PendingUserTable.findFirst({
      where: (table, funcs) => funcs.eq(table.email, payload.email),
      columns: {
        id: true,
        createdAt: true,
        email: true,
      },
    });

    return await this.db.transaction(async (tx) => {
      if (pendingUser) {
        // checks for register cooldown
        const elapsedTime = getElapsedTime(pendingUser.createdAt, "seconds");
        if (elapsedTime < RESEND_CODE_COOLDOWN) {
          throw new LinaError(LinaErrorType.REQ_COOLDOWN);
        }
      } else {
        // inserts new pending user if not exists
        const hashedPass = await argon2.hash(payload.password);
        const [newPendingUser] = await tx
          .insert(PendingUserTable)
          .values({
            email: payload.email,
            passwordHash: hashedPass,
          })
          .returning();
        pendingUser = newPendingUser;
      }

      return this.authUtilService.initiateAccountVerification(pendingUser);
    });
  }

  async resendVerificationCode(
    payload: ResendVerificationCodePayload,
  ): Promise<string> {
    const pendingUser = await this.db.query.PendingUserTable.findFirst({
      where: (table, funcs) => funcs.eq(table.email, payload.email),
      columns: {
        id: true,
        createdAt: true,
        email: true,
      },
    });
    if (!pendingUser) {
      throw new LinaError(LinaErrorType.NOT_REGISTERED);
    }

    const elapsedTime = getElapsedTime(pendingUser.createdAt, "minutes");
    if (elapsedTime < RESEND_CODE_COOLDOWN) {
      throw new LinaError(LinaErrorType.REQ_COOLDOWN);
    }

    return await this.db.transaction(async (tx) => {
      await tx
        .update(PendingUserTable)
        .set({ createdAt: new Date() })
        .where(eq(PendingUserTable.id, pendingUser.id))
        .execute();

      return this.authUtilService.initiateAccountVerification(pendingUser);
    });
  }

  async verifyRegister(
    res: Response,
    payload: VerifyRegisterPayload,
  ): Promise<Omit<IUser, "passwordHash">> {
    // no need to verify if the pending userscreation has expired,
    // as an expired JWT token automatically invalidates the row
    const tokenPayload = this.authUtilService.verifyJwtToken<{
      userId: string;
      code: number;
    }>(payload.token, this.authConfig.verification.secret);

    const [pendingUser] = await this.db
      .select()
      .from(PendingUserTable)
      .where(eq(PendingUserTable.id, tokenPayload.userId));
    if (!pendingUser) {
      throw new LinaError(LinaErrorType.NOT_REGISTERED);
    }
    if (payload.code !== tokenPayload.code) {
      throw new LinaError(LinaErrorType.INVALID_CODE);
    }

    return await this.db.transaction(async (tx) => {
      await tx
        .delete(PendingUserTable)
        .where(eq(PendingUserTable.id, pendingUser.id))
        .execute();

      const user = await this.authUtilService.initiateUserAccount(tx, {
        email: pendingUser.email,
        passwordHash: pendingUser.passwordHash,
        isVerified: false,
        accountType: ACCOUNT_TYPE.LOCAL,
        emailVerifiedAt: new Date(),
      });

      this.authUtilService.generateAuthToken(res, user);
      return user;
    });
  }

  async login(res: Response, payload: LoginPayload) {
    const [result] = await this.db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, payload.email));
    if (!result) {
      throw new LinaError(LinaErrorType.INVALID_EMAIL_OR_PASSWORD);
    }
    const { passwordHash, ...user } = result;

    if (!passwordHash) {
      throw new LinaError(LinaErrorType.ACCOUNT_NO_PASSWORD);
    }
    if (!(await argon2.verify(passwordHash, payload.password))) {
      throw new LinaError(LinaErrorType.INVALID_EMAIL_OR_PASSWORD);
    }

    // two-factor false: simply generate token and logged in user
    if (!user.twoFactor) {
      this.authUtilService.generateAuthToken(res, user);
      return user;
    }

    if (!payload.code && !payload.backupCode) {
      throw new LinaError(LinaErrorType.TWO_FACTOR_CODE_REQUIRED);
    }

    return await this.db.transaction(async (tx) => {
      if (payload.code) {
        const [twoFactor] = await tx
          .select({
            secret: TwoFactorSecretTable.secret,
          })
          .from(TwoFactorSecretTable)
          .where(eq(TwoFactorSecretTable.userId, user.id));

        const secret = this.cryptr.decrypt(twoFactor.secret);
        if (!otplib.authenticator.check(payload.code, secret)) {
          throw new LinaError(LinaErrorType.INVALID_TWO_FACTOR_CODE);
        }
      } else {
        const backupCodes = await tx
          .select()
          .from(TwoFactorBackupTable)
          .where(eq(TwoFactorBackupTable.userId, user.id));

        const backupCode = backupCodes.find(
          (code) => !code.used && payload.backupCode === code.code,
        );
        if (!backupCode) {
          throw new LinaError(LinaErrorType.INVALID_BACKUP_CODE);
        }

        await tx
          .update(TwoFactorBackupTable)
          .set({ used: true })
          .where(eq(TwoFactorBackupTable.id, backupCode.id));
      }

      this.authUtilService.generateAuthToken(res, user);
      return user;
    });
  }

  async setupTwoFactor(
    user: IUser,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    if (user.twoFactor) {
      throw new LinaError(LinaErrorType.TWO_FACTOR_ENABLE);
    }

    const secret = otplib.authenticator.generateSecret();
    const otpauth = otplib.authenticator.keyuri(user.email, "Lina", secret);
    let qrCodeUrl: string;
    try {
      qrCodeUrl = await toDataURL(otpauth);
    } catch (error) {
      throw new LinaError(LinaErrorType.QR_CODE_GENERATION_FAILED, error);
    }

    return { qrCodeUrl, secret };
  }

  async verifyTwoFactor(
    user: Omit<IUser, "passwordHash">,
    payload: VerifyTwoFactorPayload,
  ) {
    if (user.twoFactor) {
      throw new LinaError(LinaErrorType.TWO_FACTOR_ENABLE);
    }

    const isValid = otplib.authenticator.check(payload.code, payload.secret);
    if (!isValid) {
      throw new LinaError(LinaErrorType.INVALID_TWO_FACTOR_CODE);
    }

    const backupInsertForm: TwoFactorBackupInsertForm[] = [];
    const backupCodes: string[] = [];
    const backupCount = 8;

    for (let i = 0; i < backupCount; i++) {
      const code = randomBytes(5).toString("hex");
      backupInsertForm.push({
        code,
        used: false,
        userId: user.id,
      });
      backupCodes.push(code);
    }

    await this.db.transaction(async (tx) => {
      const encryptedSecret = this.cryptr.encrypt(payload.secret);

      await tx.insert(TwoFactorBackupTable).values(backupInsertForm).execute();
      await tx.insert(TwoFactorSecretTable).values({
        secret: encryptedSecret,
        userId: user.id,
      });
      await tx
        .update(UserTable)
        .set({ twoFactor: true })
        .where(eq(UserTable.id, user.id))
        .execute();
    });

    return backupCodes;
  }
}
