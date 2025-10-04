import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { GithubService } from "./github.service";
import { IGithubController } from "./interfaces/controller";
import { InstallationCallbackDto } from "./dto";
import { AuthorizationGuard } from "../auth/guards/authorization.guard";
import { User } from "../auth/decorators/user.decorator";

@Controller("github")
export class GithubController implements IGithubController {
  constructor(private readonly githubService: GithubService) {}

  @UseGuards(AuthorizationGuard)
  @Get("/install")
  async install(@User("id") userId: string) {
    const url = await this.githubService.generateInstallationUrl(userId);
    return { url };
  }

  @Get("/install/callback")
  async installationCallback(
    @Query() payload: InstallationCallbackDto,
  ): Promise<any> {
    return await this.githubService.installationCallback(payload);
  }
}
