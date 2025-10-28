import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { GithubService } from "./github.service";
import { IGithubController } from "./interfaces/controller";
import { CreateGithubAppDto, RedirectToGithubDto } from "./dto";
import { AuthorizationGuard } from "../auth/guards/authorization.guard";

@Controller("github")
export class GithubController implements IGithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post("/app")
  @UseGuards(AuthorizationGuard)
  async createGithubApp(@Body() payload: CreateGithubAppDto) {
    const url = await this.githubService.createGithubApp(payload);
    return { url };
  }

  /*
   Intermediary route that renders HTML to POST manifest data to GitHub.
   We can't POST directly from backend, so we return HTML that auto-submits
   a form in the user's browser to GitHub's app creation page.
  */
  @Get("/app/redirect")
  @Header("Content-Type", "text/html")
  redirectToGithub(@Query() params: RedirectToGithubDto) {
    return this.githubService.redirectToGithub(params);
  }

  // @UseGuards(AuthorizationGuard)
  // @Get("/install")
  // async install(@User("id") userId: string) {
  //   const url = await this.githubService.generateInstallationUrl(userId);
  //   return { url };
  // }

  // @Get("/install/callback")
  // async installationCallback(
  //   @Query() payload: InstallationCallbackDto,
  // ): Promise<any> {
  //   return await this.githubService.installationCallback(payload);
  // }
}
