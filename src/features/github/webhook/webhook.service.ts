import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EmitterWebhookEvent, Webhooks } from "@octokit/webhooks";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { DATABASE } from "src/drizzle/constants";
import { IntegrationTable } from "src/drizzle/schemas";
import { Database } from "src/drizzle/types";
import { IWebhookService } from "./interfaces/service";
import { WebhookUtilService } from "./util.service";

@Injectable()
export class WebhookService implements IWebhookService, OnModuleInit {
  private webhooks: Webhooks;
  private logger = new Logger(WebhookService.name);

  constructor(
    @Inject(DATABASE) private db: Database,
    private webhookUtilService: WebhookUtilService,
  ) {
    this.webhooks = new Webhooks({ secret: "TEMP" });
  }

  async verifyAndReceive(rawPayload: string, event: string, signature: string) {
    await this.webhookUtilService.verifyWebhook(rawPayload, event, signature);
    await this.webhooks.receive({
      id: randomUUID(),
      // @ts-expect-error cant type cast string
      name: event,
      payload: JSON.parse(rawPayload) as Record<string, unknown>,
    });
  }

  // updates repos field with added repositories
  async handleInstallation(
    event: EmitterWebhookEvent<"installation_repositories">,
  ) {
    this.logger.log(`webhooks: ${event.name}.${event.payload.action}`);

    if (event.payload.action !== "added") {
      return;
    }

    const githubApp = await this.webhookUtilService.getGithubApp(
      event.payload.installation.id,
    );
    // concatenates the two JSONB arrays
    await this.db
      .update(IntegrationTable)
      .set({
        data: sql`
          jsonb_set(
            ${IntegrationTable.data},
            '{repos}',
            COALESCE(
              ${IntegrationTable.data}->'repos',
              '[]'::jsonb
            ) || ${JSON.stringify(event.payload.repositories_added)}::jsonb
          )
        `,
      })
      .where(eq(IntegrationTable.id, githubApp.id));
  }

  // updates repos field with removed repositories
  async handleInstallationRemoved(
    event: EmitterWebhookEvent<"installation_repositories.removed">,
  ) {
    this.logger.log(`webhooks: ${event.name}.${event.payload.action}`);

    const githubApp = await this.webhookUtilService.getGithubApp(
      event.payload.installation.id,
    );
    const removedIds = event.payload.repositories_removed
      .map((r) => r.id)
      .join(",");

    await this.db
      .update(IntegrationTable)
      .set({
        data: sql`
        jsonb_set(
          ${IntegrationTable.data},
          '{repos}',
          (
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
            FROM jsonb_array_elements(${IntegrationTable.data}->'repos') AS elem
            WHERE (elem->>'id')::bigint != ALL(ARRAY[${sql.raw(removedIds)}])
          )
        )
      `,
      })
      .where(eq(IntegrationTable.id, githubApp.id));
  }

  onModuleInit() {
    this.webhooks.on(
      "installation_repositories",
      this.handleInstallation.bind(this),
    );
    this.webhooks.on(
      "installation_repositories.removed",
      this.handleInstallationRemoved.bind(this),
    );
  }
}
