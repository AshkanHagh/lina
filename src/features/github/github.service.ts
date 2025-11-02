import { Inject, Injectable } from "@nestjs/common";
import { IGithubService } from "./interfaces/service";
import { SetupGithubAppPayload } from "./dtos";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { RedirectStateTable, SettingTable } from "src/drizzle/schemas";
import { eq } from "drizzle-orm";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { randomBytes } from "node:crypto";

@Injectable()
export class GithubService implements IGithubService {
  constructor(@Inject(DATABASE) private db: Database) {}

  async setupGithubApp(
    userId: string,
    payload: SetupGithubAppPayload,
  ): Promise<{ manifest: unknown; state: string }> {
    const [[instanceUrl], [webhookUrl]] = await Promise.all([
      this.db
        .select({ value: SettingTable.value })
        .from(SettingTable)
        .where(eq(SettingTable.key, "APP_URL")),
      this.db
        .select({ value: SettingTable.value })
        .from(SettingTable)
        .where(eq(SettingTable.key, "GITHUB_WEBHOOK_URL")),
    ]);

    if (!instanceUrl) {
      throw new LinaError(LinaErrorType.SETTING_NOT_FOUND, "APP_URL");
    }
    if (!webhookUrl) {
      throw new LinaError(
        LinaErrorType.SETTING_NOT_FOUND,
        "GITHUB_WEBHOOK_URL",
      );
    }

    const state = randomBytes(32).toString("hex");
    await this.db.insert(RedirectStateTable).values({
      flow: "setup_github_app",
      expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      token: state,
      userId,
    });

    const manifest = {
      name: payload.name,
      url: instanceUrl.value,
      hook_attributes: {
        url: webhookUrl.value,
        active: true,
      },
      redirect_url: `${instanceUrl.value}/api/v1/github/app/callback`,
      public: false,
      default_permissions: {
        contents: "read",
        metadata: "read",
      },
      default_events: ["push"],
      description: "GitHub App for automated deployments via Lina",
    };

    return { manifest, state };
  }
}
