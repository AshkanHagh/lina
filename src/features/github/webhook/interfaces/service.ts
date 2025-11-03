import { EmitterWebhookEvent } from "@octokit/webhooks";

export interface IWebhookService {
  handleInstallation(
    payload: EmitterWebhookEvent<"installation_repositories.added">,
  ): Promise<void>;
  handleInstallationRemoved(
    payload: EmitterWebhookEvent<"installation_repositories.removed">,
  ): Promise<void>;
}
