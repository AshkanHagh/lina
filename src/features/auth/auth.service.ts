import { Inject, Injectable } from "@nestjs/common";
import { IAuthService } from "./interfaces/service";
import { Response } from "express";
import { User, UserTable } from "src/drizzle/schemas";
import { LoginPayload, RegisterPayload } from "./dtos";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { SettingTable } from "src/drizzle/schemas/setting.schema";
import { eq } from "drizzle-orm";
import { LinaError, LinaErrorType } from "src/filters/exception";
import argon2 from "argon2";
import { AuthUtilService } from "./util.service";
import { authenticator } from "otplib";
import { decryptString } from "@47ng/cloak";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(DATABASE) private db: Database,
    @AuthConfig() private authConfig: IAuthConfig,
    private authUtilService: AuthUtilService,
  ) {}

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
        secret = await decryptString(
          user.twoFactorSecret,
          this.authConfig.twoFactorEncryptionKey,
        );
      } catch (err) {
        throw new LinaError(LinaErrorType.DECRYPTION_ERROR, err);
      }

      const isCodeValid = authenticator.check(payload.twoFactorCode, secret);
      if (!isCodeValid) {
        throw new LinaError(LinaErrorType.INVALID_TWO_FACTOR_CODE);
      }
    } else if (payload.twoFactorBackupCode) {
      if (!user.twoFactorRecoveryCodes?.length) {
        throw new LinaError(LinaErrorType.NO_BACKUP_CODES_AVAILABLE);
      }

      const isCodeValid = user.twoFactorRecoveryCodes.some(
        (code) => code === payload.twoFactorBackupCode,
      );
      if (!isCodeValid) {
        throw new LinaError(LinaErrorType.INVALID_TWO_FACTOR_CODE);
      }

      // remove used backup code
      await this.db
        .update(UserTable)
        .set({
          twoFactorRecoveryCodes: user.twoFactorRecoveryCodes.filter(
            (code) => code !== payload.twoFactorBackupCode,
          ),
        })
        .where(eq(UserTable.id, user.id));
    } else {
      throw new LinaError(LinaErrorType.TWO_FACTOR_REQUIRED);
    }

    this.authUtilService.generateAuthToken(res, user.id);
    return this.authUtilService.omitSensitiveFields(user);
  }
}
