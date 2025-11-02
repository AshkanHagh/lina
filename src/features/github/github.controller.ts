import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { GithubService } from "./github.service";
import { IGithubController } from "./interfaces/controller";
import { SetupGithubAppDto } from "./dtos";
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
  ): Promise<{ manifest: unknown; state: string }> {
    return this.githubService.setupGithubApp(userId, payload);
  }
}
