import { SetupGithubAppPayload } from "../dtos";

export interface IGithubService {
  setupGithubApp(
    userId: string,
    payload: SetupGithubAppPayload,
  ): Promise<{ manifest: unknown; state: string }>;
}
