import {
  GithubAppCallbackPayload,
  InstallCallbackPayload,
  SetupGithubAppPayload,
} from "../dtos";
import { GithubAppDetails } from "../types";

export interface IGithubService {
  setupGithubApp(
    userId: string,
    payload: SetupGithubAppPayload,
  ): Promise<{ manifest: unknown; state: string; org: string | undefined }>;
  githubAppCallback(payload: GithubAppCallbackPayload): Promise<void>;
  setupGithubInstall(userId: string, appSlug: string): Promise<string>;
  githubInstallCallback(payload: InstallCallbackPayload): Promise<void>;
  getGithubApp(
    userId: string,
    integrationId: string,
  ): Promise<Omit<GithubAppDetails, "pem">>;
}
