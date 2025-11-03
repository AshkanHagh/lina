import { Inject } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DATABASE } from "src/drizzle/constants";
import { IntegrationTable } from "src/drizzle/schemas";
import { Database } from "src/drizzle/types";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { GithubAppDetails } from "../types";
import crypto from "node:crypto";

export class WebhookUtilService {
  constructor(@Inject(DATABASE) private db: Database) {}

  /*
    verify webhook signature by user github app webhookSecret
    receiving webhook events
  */
  async verifyWebhook(rawPayload: string, event: string, signature: string) {
    let installationId: number | undefined;
    try {
      const payload = JSON.parse(rawPayload) as Record<string, any>;
      // eslint-disable-next-line
      installationId = payload.installation.id as number;
      if (!installationId) {
        throw new LinaError(LinaErrorType.INSTALLATION_ID_MISSING);
      }
    } catch (error) {
      throw new LinaError(LinaErrorType.WEBHOOK_VERIFICATION_FAILED, error);
    }

    const githubApp = await this.getGithubApp(installationId);
    if (!githubApp.data.webhookSecret) {
      throw new LinaError(LinaErrorType.WEBHOOK_SECRET_MISSING);
    }

    this.verifySignature(githubApp.data.webhookSecret, rawPayload, signature);
  }

  verifySignature(secret: string, payload: string, signature: string) {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const generatedSignature = `sha256=${hmac.digest("hex")}`;

    if (signature !== generatedSignature) {
      throw new LinaError(LinaErrorType.INVALID_WEBHOOK_SIGNATURE);
    }
  }

  async getGithubApp(installationId: number) {
    const [githubApp] = await this.db
      .select({
        id: IntegrationTable.id,
        data: IntegrationTable.data,
      })
      .from(IntegrationTable)
      .where(
        sql`
          ${IntegrationTable.data}->>'installationId' IS NOT NULL
          AND (${IntegrationTable.data}->>'installationId')::integer = ${installationId}
        `,
      );

    if (!githubApp) {
      throw new LinaError(LinaErrorType.INTEGRATION_NOT_FOUND);
    }
    return { ...githubApp, data: githubApp.data as GithubAppDetails };
  }
}
