import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { IAuthController } from "./interfaces/controller";
import { Response } from "express";
import { User } from "src/drizzle/schemas";
import { LoginDto, RegisterDto } from "./dtos";
import { AuthUser } from "src/types";
import { UserD } from "./decorators/user.decorator";
import { AuthorizationGuard } from "./gurads/authorization.guard";

@Controller("auth")
export class AuthController implements IAuthController {
  constructor(private authService: AuthService) {}

  @Post("/register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() payload: RegisterDto,
  ): Promise<User> {
    return this.authService.register(res, payload);
  }

  @Post("/login")
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() payload: LoginDto,
  ): Promise<User> {
    return this.authService.login(res, payload);
  }

  @Get("/two-factor/setup")
  @UseGuards(AuthorizationGuard)
  async setupTwoFactor(@UserD() user: AuthUser): Promise<{ url: string }> {
    const url = await this.authService.setupTwoFactor(user);
    return { url };
  }
}
