import { Response } from "express";
import { User, UserRecord, UserTable } from "src/drizzle/schemas";
import jwt from "jsonwebtoken";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { Inject } from "@nestjs/common";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { eq } from "drizzle-orm";
import argon2 from "argon2";

export class AuthUtilService {
  constructor(
    @AuthConfig() private authConfig: IAuthConfig,
    @Inject(DATABASE) private db: Database,
  ) {}

  generateAuthToken(res: Response, userId: string) {
    let authToken: string;
    try {
      authToken = jwt.sign(
        {
          userId,
          exp: Math.floor(Date.now() / 1000 + this.authConfig.authToken.exp),
        },
        this.authConfig.authToken.secret,
      );
    } catch (error) {
      throw new LinaError(LinaErrorType.FAILED_TO_GENERATE_AUTH_TOKEN, error);
    }

    res.cookie("auth_token", authToken, {
      httpOnly: true,
      maxAge: this.authConfig.cookie.maxAge,
      secure: this.authConfig.cookie.secure,
      sameSite: this.authConfig.cookie.secure ? "none" : "lax",
      path: "/",
    });
  }

  /* eslint-disable */
  omitSensitiveFields(user: UserRecord): User {
    const {
      passwordHash,
      updatedAt,
      twoFactorRecoveryCodes,
      twoFactorSecret,
      ...rest
    } = user;
    return rest;
  }
  /* eslint-enable */

  async validateLogin(email: string, pass: string) {
    const [user] = await this.db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email));

    if (!user) {
      throw new LinaError(LinaErrorType.INVALID_EMAIL_OR_PASSWORD);
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, pass);
    if (!isPasswordValid) {
      throw new LinaError(LinaErrorType.INVALID_EMAIL_OR_PASSWORD);
    }

    return user;
  }
}
