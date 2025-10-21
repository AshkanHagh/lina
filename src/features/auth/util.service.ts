import { Inject, Injectable } from "@nestjs/common";
import { sign } from "jsonwebtoken";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { IUser, UserTable } from "src/drizzle/schemas";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { Response } from "express";
import { AUTH_TOKEN_COOKIE_NAME } from "./constants";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { eq } from "drizzle-orm";
import * as argon2 from "argon2";

@Injectable()
export class AuthUtilService {
  constructor(
    @AuthConfig() private authConfig: IAuthConfig,
    @Inject(DATABASE) private db: Database,
  ) {}

  async validateLoginUser(email: string, password: string) {
    const [user] = await this.db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email));

    if (!user) {
      throw new LinaError(LinaErrorType.INVALID_EMAIL_OR_PASSWORD);
    }

    const passwordRetryAllowed = this.authConfig.passwordRetryLimit;
    if (user.passwordRetryCount >= passwordRetryAllowed) {
      throw new LinaError(LinaErrorType.PASSWORD_RETRY_LIMIT_REACHED);
    }

    if (!(await argon2.verify(user.passwordHash, password))) {
      await this.db
        .update(UserTable)
        .set({
          passwordRetryCount: user.passwordRetryCount + 1,
        })
        .where(eq(UserTable.id, user.id));
      throw new LinaError(LinaErrorType.INVALID_EMAIL_OR_PASSWORD);
    }

    const { passwordHash, ...userWithoutPass } = user;
    return userWithoutPass;
  }

  generateAuthToken(res: Response, user: Pick<IUser, "email" | "id">) {
    const token = sign(
      {
        userId: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000 + this.authConfig.authToken.exp),
      },
      this.authConfig.authToken.secret,
    );

    res.cookie(AUTH_TOKEN_COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: this.authConfig.authToken.exp,
    });
  }
}
