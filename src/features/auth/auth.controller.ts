import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { IAuthController } from "./interfaces/controller";
import {
  LoginDto,
  RegisterDto,
  ResendVerificationCodeDto,
  VerifyRegisterDto,
  VerifyTwoFactorDto,
} from "./dto";
import { Response } from "express";
import { IUser } from "src/drizzle/schemas";
import { AuthorizationGuard } from "./guards/authorization.guard";
import { User } from "./decorators/user.decorator";

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

  @Get("/two-factor/setup")
  @UseGuards(AuthorizationGuard)
  async setupTwoFactor(
    @User() user: IUser,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    return await this.authService.setupTwoFactor(user);
  }

  @Post("/two-factor/verify")
  @UseGuards(AuthorizationGuard)
  async verifyTwoFactor(
    @User() user: Omit<IUser, "passwordHash">,
    @Body() payload: VerifyTwoFactorDto,
  ): Promise<{ codes: string[] }> {
    const codes = await this.authService.verifyTwoFactor(user, payload);
    return { codes };
  }
}
