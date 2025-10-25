import { Body, Controller, Get, Post, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { IAuthController } from "./interfaces/controller";
import { LoginDto, RegisterDto, VerifyTwoFactorDto } from "./dto";
import { Response } from "express";
import { ISanitizedUser } from "src/drizzle/schemas";
import { AuthorizationGuard } from "./guards/authorization.guard";
import { User } from "./decorators/user.decorator";

@Controller("auth")
export class AuthController implements IAuthController {
  constructor(private authService: AuthService) {}

  @Post("/register")
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() payload: RegisterDto,
  ): Promise<ISanitizedUser> {
    return await this.authService.register(res, payload);
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
    @User("id") userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    return await this.authService.setupTwoFactor(userId);
  }

  @Post("/two-factor/verify")
  @UseGuards(AuthorizationGuard)
  async verifyTwoFactor(
    @User("id") userId: string,
    @Body() payload: VerifyTwoFactorDto,
  ): Promise<{ codes: string[] }> {
    const codes = await this.authService.verifyTwoFactor(userId, payload);
    return { codes };
  }
}
