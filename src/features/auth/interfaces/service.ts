import { User } from "src/drizzle/schemas";
import { LoginPayload, RegisterPayload, VerifyTwoFactorPayload } from "../dtos";
import { Response } from "express";
import { AuthUser } from "src/types";

export interface IAuthService {
  register(res: Response, payload: RegisterPayload): Promise<User>;
  login(res: Response, payload: LoginPayload): Promise<User>;
  setupTwoFactor(user: AuthUser): Promise<string>;
  verifyTwoFactor(
    user: AuthUser,
    payload: VerifyTwoFactorPayload,
  ): Promise<string[]>;
}
