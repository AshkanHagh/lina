import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { GithubService } from "./github.service";
import { IGithubController } from "./interfaces/controller";
import {
  GithubAppCallbackDto,
  InstallCallbackDto,
  SetupGithubAppDto,
} from "./dtos";
import { UserD } from "../auth/decorators/user.decorator";
import { AuthorizationGuard } from "../auth/gurads/authorization.guard";

@Controller("github")
export class GithubController implements IGithubController {
  constructor(private githubService: GithubService) {}

  @Post("/app/setup")
  @UseGuards(AuthorizationGuard)
  async setupGithubApp(
    @UserD("id") userId: string,
    @Body() payload: SetupGithubAppDto,
  ) {
    return this.githubService.setupGithubApp(userId, payload);
  }

  @Get("/app/callback")
  async githubAppCallback(@Query() payload: GithubAppCallbackDto) {
    await this.githubService.githubAppCallback(payload);
  }

  @Get("/install/setup")
  @UseGuards(AuthorizationGuard)
  async setupGithubInstall(
    @UserD("id") userId: string,
    @Query("appSlug") appSlug: string,
  ): Promise<{ url: string }> {
    const url = await this.githubService.setupGithubInstall(userId, appSlug);
    return { url };
  }

  @Get("/install/callback")
  async githubInstallCallback(
    @Query() payload: InstallCallbackDto,
  ): Promise<void> {
    await this.githubService.githubInstallCallback(payload);
  }
}
