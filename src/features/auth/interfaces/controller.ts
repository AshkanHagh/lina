import { IUser } from "src/drizzle/schemas";
import {
  LoginDto,
  RegisterDto,
  ResendVerificationCodeDto,
  VerifyRegisterDto,
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
}
