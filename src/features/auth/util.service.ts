import { Injectable } from "@nestjs/common";
import { sign } from "jsonwebtoken";
import { randomInt } from "node:crypto";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { IPendingUser } from "src/drizzle/schemas";
import { Database } from "src/drizzle/types";
import { PendingUserRepository } from "src/repository/repositories/pending-user.repository";

@Injectable()
export class AuthUtilService {
  constructor(
    @AuthConfig() private authConfig: IAuthConfig,
    private penidngUserRepository: PendingUserRepository,
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
    console.log(`TEMP: VERIFICATION CODE: ${code}`);

    await this.penidngUserRepository.update(tx, {
      token,
    });
    // TODO: send verification email
    return token;
  }
}
