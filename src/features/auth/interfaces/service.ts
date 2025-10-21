import { Response } from "express";
import { LoginPayload, RegisterPayload, VerifyTwoFactorPayload } from "../dto";
import { IUser } from "src/drizzle/schemas";

export interface IAuthService {
  register(
    res: Response,
    payload: RegisterPayload,
  ): Promise<Omit<IUser, "passwordHash">>;

  login(res: Response, payload: LoginPayload): Promise<any>;

  setupTwoFactor(
    user: Omit<IUser, "passwordHash">,
  ): Promise<{ secret: string; qrCodeUrl: string }>;

  verifyTwoFactor(
    user: Omit<IUser, "passwordHash">,
    payload: VerifyTwoFactorPayload,
  ): Promise<string[]>;
}
