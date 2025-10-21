import { Inject, Injectable } from "@nestjs/common";
import { IAuthService } from "./interfaces/service";
import { LoginPayload, RegisterPayload, VerifyTwoFactorPayload } from "./dto";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { LinaError, LinaErrorType } from "src/filters/exception";
import * as argon2 from "argon2";
import {
  IUser,
  TwoFactorBackupInsertForm,
  TwoFactorBackupTable,
  TwoFactorSecretTable,
  UserTable,
} from "src/drizzle/schemas";
import { AuthUtilService } from "./util.service";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { eq, getTableColumns } from "drizzle-orm";
import { Response } from "express";
import * as otplib from "otplib";
import { toDataURL } from "qrcode";
import { randomBytes } from "node:crypto";
import Cryptr from "cryptr";

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

  async register(res: Response, payload: RegisterPayload) {
    const [user] = await this.db
      .select({ id: UserTable.id })
      .from(UserTable)
      .where(eq(UserTable.email, payload.email));
    if (user) {
      throw new LinaError(LinaErrorType.EMAIL_ALREADY_EXISTS);
    }

    return await this.db.transaction(async (tx) => {
      const hashedPass = await argon2.hash(payload.password);

      const { passwordHash, ...userColumns } = getTableColumns(UserTable);
      const [user] = await tx
        .insert(UserTable)
        .values({
          fullname: payload.fullname,
          email: payload.email,
          passwordHash: hashedPass,
        })
        .returning(userColumns);

      this.authUtilService.generateAuthToken(res, user);
      return user;
    });
  }

  async login(res: Response, payload: LoginPayload) {
    const user = await this.authUtilService.validateLoginUser(
      payload.email,
      payload.password,
    );
    // two-factor false: simply generate token and logged in user
    if (!user.twoFactor) {
      this.authUtilService.generateAuthToken(res, user);
      return user;
    }

    if (!payload.code && !payload.backupCode) {
      throw new LinaError(LinaErrorType.TWO_FACTOR_CODE_REQUIRED);
    }

    await this.db.transaction(async (tx) => {
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
      } else if (payload.backupCode) {
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

  async setupTwoFactor(user: IUser) {
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
