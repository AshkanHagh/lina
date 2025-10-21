import { IUser } from "src/drizzle/schemas";
import { LoginDto, RegisterDto, VerifyTwoFactorDto } from "../dto";
import { Response } from "express";

export interface IAuthController {
  register(
    res: Response,
    payload: RegisterDto,
  ): Promise<Omit<IUser, "passwordHash">>;

  login(res: Response, payload: LoginDto): Promise<any>;

  setupTwoFactor(
    user: Omit<IUser, "passwordHash">,
  ): Promise<{ secret: string; qrCodeUrl: string }>;

  verifyTwoFactor(
    user: Omit<IUser, "passwordHash">,
    payload: VerifyTwoFactorDto,
  ): Promise<{ codes: string[] }>;
}
