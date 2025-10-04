import { Inject, Logger, OnModuleInit } from "@nestjs/common";
import { GithubConfig, IGithubConfig } from "src/configs/github.config";
import { EmitterWebhookEvent, Webhooks } from "@octokit/webhooks";
import { randomUUID } from "node:crypto";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { OAuthAccountTable, RepositoryTable } from "src/drizzle/schemas";
import { eq } from "drizzle-orm";
import { RepositoryRemoved } from "./types";
import { GithubAppService } from "../util-services/github-app.service";
import { IWebhooksService } from "./interfaces/service";

export class WebhooksService implements IWebhooksService, OnModuleInit {
  private webhook: Webhooks;
  private logger = new Logger(WebhooksService.name);

  constructor(
    @GithubConfig() private githubConfig: IGithubConfig,
    @Inject(DATABASE) private db: Database,
    private githubAppService: GithubAppService,
  ) {
    this.webhook = new Webhooks({
      secret: this.githubConfig.webhookSecret!,
    });
  }

  async verifyAndReceive(event: string, payload: string, signature: string) {
    try {
      await this.webhook.verifyAndReceive({
        id: randomUUID(),
        name: event,
        payload,
        signature,
      });
    } catch (error) {
      throw new LinaError(LinaErrorType.WEBHOOK_VERIFICATION_FAILED, error);
    }
  }

  private async handleRepositoryInstallation(
    event: EmitterWebhookEvent<"installation_repositories">,
  ) {
    this.logger.log(`webhooks: ${event.name}`);
    const installationId = event.payload.installation.id;

    const [user] = await this.db
      .select({ id: OAuthAccountTable.id })
      .from(OAuthAccountTable)
      .where(eq(OAuthAccountTable.installationId, installationId));
    if (!user) {
      throw new LinaError(LinaErrorType.NOT_FOUND);
    }

    // get the installation's repositories and filter by the added repositories
    const repoIds = event.payload.repositories_added.map((repo) => repo.id);
    const availableRepos =
      await this.githubAppService.getInstallationRepos(installationId);
    const addedReposFullDetail = availableRepos.filter((repo) =>
      repoIds.includes(repo.id),
    );

    await this.db.transaction(async (tx) => {
      await Promise.all(
        event.payload.repositories_removed.map(
          async (repo: RepositoryRemoved) => {
            return tx
              .delete(RepositoryTable)
              .where(eq(RepositoryTable.providerId, repo.id));
          },
        ),
      );

      await Promise.all(
        addedReposFullDetail.map(async (repo) => {
          return tx.insert(RepositoryTable).values({
            fullName: repo.full_name,
            isFork: repo.fork,
            isPrivate: repo.private,
            name: repo.name,
            ownerId: user.id,
            providerId: repo.id,
            url: repo.url,
          });
        }),
      );
    });
  }

  onModuleInit() {
    this.webhook.on(
      "installation_repositories",
      this.handleRepositoryInstallation.bind(this),
    );
  }
}
