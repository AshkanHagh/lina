import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { sign } from "jsonwebtoken";
import { randomInt } from "node:crypto";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { IPendingUser } from "src/drizzle/schemas";
import { EMAIL_EVENTS } from "src/worker/constants";
import { VerificationEmail } from "../email/types";

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
}
