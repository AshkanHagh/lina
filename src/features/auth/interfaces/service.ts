import { Response } from "express";
import { LoginPayload, RegisterPayload, VerifyTwoFactorPayload } from "../dto";
import { ISanitizedUser } from "src/drizzle/schemas";

export interface IAuthService {
  register(res: Response, payload: RegisterPayload): Promise<ISanitizedUser>;

  login(res: Response, payload: LoginPayload): Promise<any>;
  setupTwoFactor(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string }>;

  verifyTwoFactor(
    userId: string,
    payload: VerifyTwoFactorPayload,
  ): Promise<string[]>;
}
