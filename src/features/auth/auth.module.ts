import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { DrizzleModule } from "src/drizzle/drizzle.module";
import { AuthUtilService } from "./util.service";
import { OAuthController } from "./oauth/oauth.controller";
import { OAuthService } from "./oauth/oauth.service";
import { GitOAuthService } from "./oauth/util-services/git-oauth.service";

@Module({
  imports: [DrizzleModule],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, AuthUtilService, OAuthService, GitOAuthService],
})
export class AuthModule {}
