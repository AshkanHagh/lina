import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { IAuthController } from "./interfaces/controller";
import { RegisterDto, ResendVerificationCodeDto } from "./dto";

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
}
