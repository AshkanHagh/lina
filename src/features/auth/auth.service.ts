import { Inject, Injectable } from "@nestjs/common";
import { IAuthService } from "./interfaces/service";
import { RegisterPayload } from "./dto";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { UserRepository } from "src/repository/repositories/user.repository";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { PendingUserRepository } from "src/repository/repositories/pending-user.repository";
import { getElapsedTime } from "src/utils/elapsed-time";
import * as argon2 from "argon2";
import { IPendingUser } from "src/drizzle/schemas";
import { AuthUtilService } from "./util.service";

@Injectable()
export class AuthService implements IAuthService {
  private REGISTER_COOLDOWN = 60 * 2;

  constructor(
    @Inject(DATABASE) private db: Database,
    private userRepository: UserRepository,
    private pendingUserRepository: PendingUserRepository,
    private authUtilService: AuthUtilService,
  ) {}

  async register(payload: RegisterPayload): Promise<string> {
    const user = await this.userRepository.findByEmail(payload.email, {
      id: true,
    });
    if (user) {
      throw new LinaError(LinaErrorType.EMAIL_ALREADY_EXISTS);
    }

    let pendingUser:
      | IPendingUser
      | Pick<IPendingUser, "id" | "createdAt" | "email">
      | undefined;
    pendingUser = await this.pendingUserRepository.findByEmail(payload.email, {
      id: true,
      createdAt: true,
      email: true,
    });

    return await this.db.transaction(async (tx) => {
      if (pendingUser) {
        // checks for register cooldown
        const elapsedTime = getElapsedTime(pendingUser.createdAt, "seconds");
        if (elapsedTime < this.REGISTER_COOLDOWN) {
          throw new LinaError(LinaErrorType.REQ_COOLDOWN);
        }
      } else {
        // inserts new pending user if not exists
        const hashedPass = await argon2.hash(payload.password);
        pendingUser = await this.pendingUserRepository.insert(tx, {
          email: payload.email,
          passwordHash: hashedPass,
        });
      }

      return await this.authUtilService.initiateAccountVerification(
        tx,
        pendingUser,
      );
    });
  }
}
