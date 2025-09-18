import { Inject, Injectable } from "@nestjs/common";
import { IAuthService } from "./interfaces/service";
import {
  RegisterPayload,
  ResendVerificationCodePayload,
  VerifyRegisterPayload,
} from "./dto";
import { ACCOUNT_TYPE, DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { getElapsedTime } from "src/utils/elapsed-time";
import * as argon2 from "argon2";
import { IPendingUser, IUser, PendingUserTable } from "src/drizzle/schemas";
import { AuthUtilService } from "./util.service";
import { RESEND_CODE_COOLDOWN } from "./constants";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { eq } from "drizzle-orm";
import { Response } from "express";

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(DATABASE) private db: Database,
    @AuthConfig() private authConfig: IAuthConfig,
    private authUtilService: AuthUtilService,
  ) {}

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
}
