import { Inject, Injectable } from "@nestjs/common";
import { IAuthService } from "./interfaces/service";
import { Response } from "express";
import { User, UserTable } from "src/drizzle/schemas";
import { LoginPayload, RegisterPayload, VerifyTwoFactorPayload } from "./dtos";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { SettingTable } from "src/drizzle/schemas/setting.schema";
import { eq } from "drizzle-orm";
import { LinaError, LinaErrorType } from "src/filters/exception";
import argon2 from "argon2";
import { AuthUtilService } from "./util.service";
import { authenticator } from "otplib";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { AuthUser } from "src/types";
import { toDataURL } from "qrcode";
import Cryptr from "cryptr";
import { randomBytes } from "node:crypto";

@Injectable()
export class AuthService implements IAuthService {
  private cryptr: Cryptr;

  constructor(
    @Inject(DATABASE) private db: Database,
    @AuthConfig() private authConfig: IAuthConfig,
    private authUtilService: AuthUtilService,
  ) {
    this.cryptr = new Cryptr(this.authConfig.twoFactorEncryptionKey);
  }

  // TODO: on first registration generate default settings for user like projects envs...
  async register(res: Response, payload: RegisterPayload): Promise<User> {
    const [isRegisterEnabled] = await this.db
      .select()
      .from(SettingTable)
      .where(eq(SettingTable.key, "REGISTER_ENABLE"));

    if (isRegisterEnabled.value === "false") {
      throw new LinaError(LinaErrorType.REGISTER_NOT_ENABLED);
    }

    const hashedPass = await argon2.hash(payload.password);

    return await this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(UserTable)
        .values({
          fullName: payload.fullName,
          email: payload.email,
          passwordHash: hashedPass,
        })
        .returning();

      await tx
        .update(SettingTable)
        .set({ value: "false" })
        .where(eq(SettingTable.key, "REGISTER_ENABLE"));

      this.authUtilService.generateAuthToken(res, user.id);
      return this.authUtilService.omitSensitiveFields(user);
    });
  }

  async login(res: Response, payload: LoginPayload): Promise<User> {
    const user = await this.authUtilService.validateLogin(
      payload.email,
      payload.password,
    );

    // handle users without 2FA enabled
    if (!user.twoFactorConfirmedAt) {
      this.authUtilService.generateAuthToken(res, user.id);
      return this.authUtilService.omitSensitiveFields(user);
    }

    if (payload.twoFactorCode) {
      if (!user.twoFactorSecret) {
        throw new LinaError(LinaErrorType.TWO_FACTOR_NOT_ENABLED);
      }

      let secret: string;
      try {
        secret = this.cryptr.decrypt(user.twoFactorSecret);
      } catch (err) {
        throw new LinaError(LinaErrorType.DECRYPTION_ERROR, err);
      }

      const isCodeValid = authenticator.check(payload.twoFactorCode, secret);
      if (!isCodeValid) {
        throw new LinaError(LinaErrorType.INVALID_TWO_FACTOR_CODE);
      }
    } else if (payload.twoFactorBackupCode) {
      const { timingSafeEqual } = await import("crypto");

      await this.db.transaction(async (tx) => {
        const [userTwoFactor] = await tx
          .select({
            backupCodes: UserTable.twoFactorRecoveryCodes,
          })
          .from(UserTable)
          .where(eq(UserTable.id, user.id))
          .for("update");

        if (!userTwoFactor.backupCodes?.length) {
          throw new LinaError(LinaErrorType.NO_BACKUP_CODES_AVAILABLE);
        }

        const isCodeValid = userTwoFactor.backupCodes.some((code) => {
          try {
            return (
              code.length === payload.twoFactorBackupCode?.length &&
              timingSafeEqual(
                Buffer.from(code),
                Buffer.from(payload.twoFactorBackupCode),
              )
            );
          } catch (_) {
            return false;
          }
        });
        if (!isCodeValid) {
          throw new LinaError(LinaErrorType.INVALID_TWO_FACTOR_CODE);
        }

        // remove used backup code
        await tx
          .update(UserTable)
          .set({
            twoFactorRecoveryCodes: userTwoFactor.backupCodes.filter(
              (code) => code !== payload.twoFactorBackupCode,
            ),
          })
          .where(eq(UserTable.id, user.id));
      });
    } else {
      throw new LinaError(LinaErrorType.TWO_FACTOR_REQUIRED);
    }

    this.authUtilService.generateAuthToken(res, user.id);
    return this.authUtilService.omitSensitiveFields(user);
  }

  async setupTwoFactor(user: AuthUser): Promise<string> {
    const [{ twoFactorConfirmedAt }] = await this.db
      .select({
        twoFactorConfirmedAt: UserTable.twoFactorConfirmedAt,
      })
      .from(UserTable)
      .where(eq(UserTable.id, user.id));

    if (twoFactorConfirmedAt) {
      throw new LinaError(LinaErrorType.TWO_FACTOR_ENABLED);
    }

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, "Lina", secret);

    let qrcodeUrl: string;
    try {
      qrcodeUrl = await toDataURL(otpauth);
    } catch (error) {
      throw new LinaError(LinaErrorType.QRCODE_GENERATION_FAILED, error);
    }

    const encryptedSecret = this.cryptr.encrypt(secret);
    await this.db
      .update(UserTable)
      .set({ twoFactorSecret: encryptedSecret })
      .where(eq(UserTable.id, user.id));

    return qrcodeUrl;
  }

  async verifyTwoFactor(
    user: AuthUser,
    payload: VerifyTwoFactorPayload,
  ): Promise<string[]> {
    const [userTwoFactor] = await this.db
      .select({
        twoFactorConfirmedAt: UserTable.twoFactorConfirmedAt,
        twoFactorSecret: UserTable.twoFactorSecret,
      })
      .from(UserTable)
      .where(eq(UserTable.id, user.id));

    if (userTwoFactor.twoFactorConfirmedAt) {
      throw new LinaError(LinaErrorType.TWO_FACTOR_ENABLED);
    }
    if (!userTwoFactor.twoFactorSecret) {
      throw new LinaError(LinaErrorType.TWO_FACTOR_NOT_ENABLED);
    }

    let decryptedSecret: string;
    try {
      decryptedSecret = this.cryptr.decrypt(userTwoFactor.twoFactorSecret);
    } catch (err) {
      throw new LinaError(LinaErrorType.DECRYPTION_ERROR, err);
    }
    const isValid = authenticator.check(payload.code, decryptedSecret);
    if (!isValid) {
      throw new LinaError(LinaErrorType.INVALID_TWO_FACTOR_CODE);
    }

    const backupCodes: string[] = [];
    const backupCount = 8;
    for (let i = 0; i < backupCount; i++) {
      const code = randomBytes(5).toString("hex");
      backupCodes.push(code);
    }

    await this.db
      .update(UserTable)
      .set({
        twoFactorRecoveryCodes: backupCodes,
        twoFactorConfirmedAt: new Date(),
      })
      .where(eq(UserTable.id, user.id))
      .execute();

    return backupCodes;
  }
}
