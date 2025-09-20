import { IUser } from "src/drizzle/schemas";
import {
  LoginDto,
  RegisterDto,
  ResendVerificationCodeDto,
  VerifyRegisterDto,
  VerifyTwoFactorDto,
} from "../dto";
import { Response } from "express";

export interface IAuthController {
  register(payload: RegisterDto): Promise<{ token: string }>;
  resendVerificationCode(
    payload: ResendVerificationCodeDto,
  ): Promise<{ token: string }>;
  verifyRegister(
    res: Response,
    payload: VerifyRegisterDto,
  ): Promise<{ user: Omit<IUser, "passwordHash"> }>;
  login(res: Response, payload: LoginDto): Promise<any>;
  setupTwoFactor(
    user: Omit<IUser, "passwordHash">,
  ): Promise<{ secret: string; qrCodeUrl: string }>;
  verifyTwoFactor(
    user: Omit<IUser, "passwordHash">,
    payload: VerifyTwoFactorDto,
  ): Promise<{ codes: string[] }>;
}
