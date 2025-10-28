import { CreateGithubAppPayload } from "../dto";

export interface IGithubService {
  createGithubApp(payload: CreateGithubAppPayload): Promise<string>;
  // generateInstallationUrl(userId: string): Promise<string>;
  // installationCallback(payload: InstallationCallbackPayload): Promise<void>;
}
