import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { sign, verify } from "jsonwebtoken";
import { randomInt } from "node:crypto";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import {
  IPendingUser,
  IUser,
  IUserInsertForm,
  UserTable,
} from "src/drizzle/schemas";
import { EMAIL_EVENTS } from "src/worker/constants";
import { VerificationEmail } from "../email/types";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { Response } from "express";
import { AUTH_TOKEN_COOKIE_NAME } from "./constants";
import { getTableColumns } from "drizzle-orm";
import { Database } from "src/drizzle/types";

@Injectable()
export class AuthUtilService {
  constructor(
    @AuthConfig() private authConfig: IAuthConfig,
    private eventEmitter: EventEmitter2,
  ) {}

  initiateAccountVerification(pendingUser: Pick<IPendingUser, "id" | "email">) {
    const code = randomInt(100_000, 999_999);
    const token = sign(
      {
        userId: pendingUser.id,
        code,
        exp: Math.floor(Date.now() / 1000 + this.authConfig.verification.exp),
      },
      this.authConfig.verification.secret,
    );

    const emailPayload: VerificationEmail = {
      email: pendingUser.email,
      verifyCode: code,
    };
    this.eventEmitter.emit(EMAIL_EVENTS.SEND_VERIFICATION_EMAIL, emailPayload);

    return token;
  }

  verifyJwtToken<T>(token: string, secret: string) {
    try {
      const result = verify(token, secret);
      return result as T;
    } catch (error) {
      throw new LinaError(LinaErrorType.INVALID_TOKEN, error);
    }
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

  async initiateUserAccount(tx: Database, insertForm: IUserInsertForm) {
    // removing passwordHash row from user table return object
    const { passwordHash: _, ...userColumns } = getTableColumns(UserTable);
    const user = await tx
      .insert(UserTable)
      .values(insertForm)
      .returning(userColumns);

    if (insertForm.avatar) {
      // TODO: upload user avatar to s3
    }
    // TODO: insert user initial starting money
    return user[0];
  }
}
