import { Controller, Get, Query, Res } from "@nestjs/common";
import { OAuthService } from "./oauth.service";
import { IOAuthController } from "./interfaces/controller";
import { IUser } from "src/drizzle/schemas";
import { Response } from "express";
import { OAuthCallbackDto } from "./dto";

@Controller("oauth")
export class OAuthController implements IOAuthController {
  constructor(private oauthService: OAuthService) {}

  @Get("/")
  async initiateOAuth() {
    const url = await this.oauthService.initiateOAuth();
    return { url };
  }

  @Get("/callback/")
  async oauthCallback(
    @Res({ passthrough: true }) res: Response,
    @Query() payload: OAuthCallbackDto,
  ): Promise<Omit<IUser, "passwordHash">> {
    return await this.oauthService.oauthCallback(res, payload);
  }
}
