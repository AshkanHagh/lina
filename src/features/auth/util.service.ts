import { Response } from "express";
import { User, UserRecord } from "src/drizzle/schemas";
import jwt from "jsonwebtoken";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { LinaError, LinaErrorType } from "src/filters/exception";

export class AuthUtilService {
  constructor(@AuthConfig() private authConfig: IAuthConfig) {}

  generateAuthToken(res: Response, userId: string) {
    let authToken: string;
    try {
      authToken = jwt.sign(
        {
          userId,
          exp: Math.floor(Date.now() / 1000 + this.authConfig.authToken.exp),
        },
        this.authConfig.authToken.secret!,
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

  omitSensitiveFields(user: UserRecord): User {
    // eslint-disable-next-line
    const { passwordHash, updatedAt, ...rest } = user;
    return rest;
  }
}
