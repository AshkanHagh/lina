import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { GithubService } from "./github.service";
import { IGithubController } from "./interfaces/controller";
import {
  GithubAppCallbackDto,
  InstallCallbackDto,
  SetupGithubAppDto,
} from "./dtos";
import { UserD } from "../auth/decorators/user.decorator";
import { AuthorizationGuard } from "../auth/gurads/authorization.guard";
import { GithubAppDetails } from "./types";
import { SkipAuth } from "../auth/decorators/skip-auth.decorator";

@Controller("github")
@UseGuards(AuthorizationGuard)
export class GithubController implements IGithubController {
  constructor(private githubService: GithubService) {}

  @Post("/app/setup")
  async setupGithubApp(
    @UserD("id") userId: string,
    @Body() payload: SetupGithubAppDto,
  ) {
    return this.githubService.setupGithubApp(userId, payload);
  }

  @Get("/app/callback")
  @SkipAuth()
  async githubAppCallback(@Query() payload: GithubAppCallbackDto) {
    await this.githubService.githubAppCallback(payload);
  }

  @Get("/install/setup")
  async setupGithubInstall(
    @UserD("id") userId: string,
    @Query("appSlug") appSlug: string,
  ): Promise<{ url: string }> {
    const url = await this.githubService.setupGithubInstall(userId, appSlug);
    return { url };
  }

  @Get("/install/callback")
  @SkipAuth()
  async githubInstallCallback(
    @Query() payload: InstallCallbackDto,
  ): Promise<void> {
    await this.githubService.githubInstallCallback(payload);
  }

  @Get("/app/:integrationId")
  async getGithubApp(
    @UserD("id") userId: string,
    @Param("integrationId") integrationId: string,
  ): Promise<Omit<GithubAppDetails, "pem">> {
    return this.githubService.getGithubApp(userId, integrationId);
  }
}
