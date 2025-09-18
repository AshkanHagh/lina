import { Response } from "express";
import {
  RegisterPayload,
  ResendVerificationCodePayload,
  VerifyRegisterPayload,
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
}
