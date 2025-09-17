import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { sign } from "jsonwebtoken";
import { randomInt } from "node:crypto";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { IPendingUser } from "src/drizzle/schemas";
import { Database } from "src/drizzle/types";
import { PendingUserRepository } from "src/repository/repositories/pending-user.repository";
import { EMAIL_EVENTS } from "src/worker/constants";
import { VerificationEmail } from "../email/types";

@Injectable()
export class AuthUtilService {
  constructor(
    @AuthConfig() private authConfig: IAuthConfig,
    private penidngUserRepository: PendingUserRepository,
    private eventEmitter: EventEmitter2,
  ) {}

  async initiateAccountVerification(
    tx: Database,
    pendingUser: Pick<IPendingUser, "id" | "email">,
  ) {
    const code = randomInt(100_000, 999_999);
    const tokenExp = Math.floor(
      Date.now() / 1000 + this.authConfig.verification.exp,
    );
    const token = sign(
      { userId: pendingUser.id, code, exp: tokenExp },
      this.authConfig.verification.secret,
    );

    await this.penidngUserRepository.update(tx, pendingUser.id, {
      token,
    });

    this.eventEmitter.emit(EMAIL_EVENTS.SEND_VERIFICATION_EMAIL, {
      email: pendingUser.email,
      verifyCode: code,
    } as VerificationEmail);
    if (process.env.NODE_ENV === "development") {
      console.log(`VERIFICATION CODE: ${code}`);
    }

    return token;
  }
}
