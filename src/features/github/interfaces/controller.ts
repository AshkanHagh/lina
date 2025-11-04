import {
  GithubAppCallbackDto,
  InstallCallbackDto,
  SetupGithubAppDto,
} from "../dtos";
import { GithubAppDetails } from "../types";

export interface IGithubController {
  setupGithubApp(
    userId: string,
    payload: SetupGithubAppDto,
  ): Promise<{ manifest: unknown; state: string; org: string | undefined }>;
  githubAppCallback(payload: GithubAppCallbackDto): Promise<void>;
  setupGithubInstall(userId: string, appSlug: string): Promise<{ url: string }>;
  githubInstallCallback(payload: InstallCallbackDto): Promise<void>;
  getGithubApp(
    userId: string,
    integrationId: string,
  ): Promise<Omit<GithubAppDetails, "pem">>;
}
