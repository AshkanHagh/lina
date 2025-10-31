import { Body, Controller, Post, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { IAuthController } from "./interfaces/controller";
import { Response } from "express";
import { User } from "src/drizzle/schemas";
import { RegisterDto } from "./dtos";

@Controller("auth")
export class AuthController implements IAuthController {
  constructor(private authService: AuthService) {}

  @Post("/register")
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() payload: RegisterDto,
  ): Promise<User> {
    return this.authService.register(res, payload);
  }
}
