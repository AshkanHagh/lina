import { Body, Controller, Post, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { IAuthController } from "./interfaces/controller";
import {
  LoginDto,
  RegisterDto,
  ResendVerificationCodeDto,
  VerifyRegisterDto,
} from "./dto";
import { Response } from "express";
import { IUser } from "src/drizzle/schemas";

@Controller("auth")
export class AuthController implements IAuthController {
  constructor(private authService: AuthService) {}

  @Post("/register")
  async register(@Body() payload: RegisterDto): Promise<{ token: string }> {
    const token = await this.authService.register(payload);
    return { token };
  }

  @Post("/verify/resend")
  async resendVerificationCode(
    @Body() payload: ResendVerificationCodeDto,
  ): Promise<{ token: string }> {
    const token = await this.authService.resendVerificationCode(payload);
    return { token };
  }

  @Post("/verify")
  async verifyRegister(
    @Res({ passthrough: true }) res: Response,
    @Body() payload: VerifyRegisterDto,
  ): Promise<{ user: Omit<IUser, "passwordHash"> }> {
    const user = await this.authService.verifyRegister(res, payload);
    return { user };
  }

  @Post("/login")
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() payload: LoginDto,
  ) {
    return await this.authService.login(res, payload);
  }
}
