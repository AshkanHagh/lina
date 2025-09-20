import { Response } from "express";
import {
  LoginPayload,
  RegisterPayload,
  ResendVerificationCodePayload,
  VerifyRegisterPayload,
  VerifyTwoFactorPayload,
} from "../dto";
import { IUser } from "src/drizzle/schemas";

export interface IAuthService {
  register(payload: RegisterPayload): Promise<string>;
  resendVerificationCode(
    payload: ResendVerificationCodePayload,
  ): Promise<string>;
  verifyRegister(
    res: Response,
    payload: VerifyRegisterPayload,
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
