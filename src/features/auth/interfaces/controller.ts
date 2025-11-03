import { Response } from "express";
import { LoginDto, RegisterDto, VerifyTwoFactorDto } from "../dtos";
import { User } from "src/drizzle/schemas";
import { AuthUser } from "src/types";

export interface IAuthController {
  register(res: Response, payload: RegisterDto): Promise<User>;
  login(res: Response, payload: LoginDto): Promise<User>;
  setupTwoFactor(user: AuthUser): Promise<{ url: string }>;
  verifyTwoFactor(
    user: AuthUser,
    payload: VerifyTwoFactorDto,
  ): Promise<string[]>;
}
