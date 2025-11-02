import { GithubAppCallbackDto, SetupGithubAppDto } from "../dtos";

export interface IGithubController {
  setupGithubApp(
    userId: string,
    payload: SetupGithubAppDto,
  ): Promise<{ manifest: unknown; state: string; org: string | undefined }>;
  githubAppCallback(payload: GithubAppCallbackDto): Promise<void>;
  setupGithubInstallation(userId: string): Promise<{ url: string }>;
}
