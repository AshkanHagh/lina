import { ISanitizedUser } from "src/drizzle/schemas";
import { LoginDto, RegisterDto, VerifyTwoFactorDto } from "../dto";
import { Response } from "express";

export interface IAuthController {
  register(res: Response, payload: RegisterDto): Promise<ISanitizedUser>;

  login(res: Response, payload: LoginDto): Promise<any>;
  setupTwoFactor(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string }>;

  verifyTwoFactor(
    userId: string,
    payload: VerifyTwoFactorDto,
  ): Promise<{ codes: string[] }>;
}
