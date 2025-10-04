import { InstallationCallbackPayload } from "../dto";

export interface IGithubService {
  generateInstallationUrl(userId: string): Promise<string>;
  installationCallback(payload: InstallationCallbackPayload): Promise<void>;
}
