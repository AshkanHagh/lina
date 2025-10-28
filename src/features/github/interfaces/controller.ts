import { CreateGithubAppDto } from "../dto";

export interface IGithubController {
  createGithubApp(payload: CreateGithubAppDto): Promise<{ url: string }>;
  // install(userId: string): Promise<{ url: string }>;
  // installationCallback(payload: InstallationCallbackDto): Promise<void>;
}
