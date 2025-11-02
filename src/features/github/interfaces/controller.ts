import { SetupGithubAppDto } from "../dtos";

export interface IGithubController {
  setupGithubApp(
    userId: string,
    payload: SetupGithubAppDto,
  ): Promise<{ manifest: unknown; state: string }>;
}
