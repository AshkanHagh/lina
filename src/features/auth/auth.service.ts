import { Inject, Injectable } from "@nestjs/common";
import { IAuthService } from "./interfaces/service";
import { Response } from "express";
import { User, UserTable } from "src/drizzle/schemas";
import { RegisterPayload } from "./dtos";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { SettingTable } from "src/drizzle/schemas/setting.schema";
import { eq } from "drizzle-orm";
import { LinaError, LinaErrorType } from "src/filters/exception";
import argon2 from "argon2";
import { AuthUtilService } from "./util.service";

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(DATABASE) private db: Database,
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
}
