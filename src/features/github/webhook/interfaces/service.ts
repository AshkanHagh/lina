import { EmitterWebhookEvent } from "@octokit/webhooks";

export interface IWebhookService {
  handleInstallationAdded(
    payload: EmitterWebhookEvent<"installation_repositories.added">,
  ): Promise<void>;
}
