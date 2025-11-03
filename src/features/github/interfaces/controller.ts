import {
  GithubAppCallbackDto,
  InstallCallbackDto,
  SetupGithubAppDto,
} from "../dtos";

export interface IGithubController {
  setupGithubApp(
    userId: string,
    payload: SetupGithubAppDto,
  ): Promise<{ manifest: unknown; state: string; org: string | undefined }>;
  githubAppCallback(payload: GithubAppCallbackDto): Promise<void>;
  setupGithubInstall(userId: string, appSlug: string): Promise<{ url: string }>;
  githubInstallCallback(payload: InstallCallbackDto): Promise<void>;
}
