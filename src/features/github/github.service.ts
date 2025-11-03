import { Inject, Injectable } from "@nestjs/common";
import { IGithubService } from "./interfaces/service";
import {
  GithubAppCallbackPayload,
  InstallCallbackPayload,
  SetupGithubAppPayload,
} from "./dtos";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import {
  IntegrationTable,
  RedirectStateTable,
  SettingTable,
} from "src/drizzle/schemas";
import { and, eq, gt, sql } from "drizzle-orm";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { randomBytes } from "node:crypto";
import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import Cryptr from "cryptr";
import { GithubAppDetails } from "./types";

@Injectable()
export class GithubService implements IGithubService {
  private octokit: Octokit;
  private cryptr: Cryptr;

  constructor(@Inject(DATABASE) private db: Database) {
    this.octokit = new Octokit();
    this.cryptr = new Cryptr(process.env.GITHUB_APP_ENCRYPTION_KEY!);
  }

  // returns a dynamic manifest and state.
  async setupGithubApp(userId: string, payload: SetupGithubAppPayload) {
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

    return {
      state,
      org: payload.org,
      manifest: {
        name: payload.name,
        url: instanceUrl.value,
        hook_attributes: {
          url: webhookUrl.value,
          active: true,
        },
        redirect_url: `${instanceUrl.value}/api/v1/github/app/callback`,
        setup_url: `${instanceUrl.value}/api/v1/github/install/callback`,
        public: false,
        default_permissions: {
          contents: "read",
          metadata: "read",
        },
        default_events: ["push"],
        description: "GitHub App for automated deployments via Lina",
      },
    };
  }

  /*
    validates the github manifest app creation callback from GitHub.
    exchanges the code for GitHub App credentials
  */
  async githubAppCallback(payload: GithubAppCallbackPayload) {
    const [state] = await this.db
      .select()
      .from(RedirectStateTable)
      .where(
        and(
          eq(RedirectStateTable.token, payload.state),
          gt(
            RedirectStateTable.expiresAt,
            new Date(Date.now() - 1000 * 60 * 15),
          ),
        ),
      );
    if (!state) {
      throw new LinaError(LinaErrorType.INVALID_STATE);
    }

    // octokit response type
    let githubAppDetails: RestEndpointMethodTypes["apps"]["createFromManifest"]["response"]["data"];
    try {
      const result = await this.octokit.apps.createFromManifest({
        code: payload.code,
      });
      if (!result.data.webhook_secret) {
        throw new LinaError(
          LinaErrorType.GITHUB_APP_SETUP_FAILED,
          "Webhook secret is missing",
        );
      }

      githubAppDetails = result.data;
    } catch (error) {
      throw new LinaError(LinaErrorType.GITHUB_APP_SETUP_FAILED, error);
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(RedirectStateTable)
        .where(eq(RedirectStateTable.id, state.id))
        .execute();

      await tx.insert(IntegrationTable).values({
        type: "github_app",
        data: <GithubAppDetails>{
          pem: this.cryptr.encrypt(githubAppDetails.pem),
          clientId: githubAppDetails.client_id,
          clientSecret: githubAppDetails.client_secret,
          id: githubAppDetails.id,
          slug: githubAppDetails.slug || githubAppDetails.name,
          webhookSecret: githubAppDetails.webhook_secret!,
          permissions: githubAppDetails.permissions as Record<string, string>,
        },
        userId: state.userId,
      });
    });
  }

  async setupGithubInstall(userId: string): Promise<string> {
    const [integration] = await this.db
      .select({
        data: IntegrationTable.data,
      })
      .from(IntegrationTable)
      .where(
        and(
          eq(IntegrationTable.type, "github_app"),
          eq(IntegrationTable.userId, userId),
        ),
      );

    if (!integration) {
      throw new LinaError(LinaErrorType.GITHUB_APP_NOT_CREATED_OR_CONFIGURED);
    }

    const state = randomBytes(32).toString("hex");
    await this.db.insert(RedirectStateTable).values({
      flow: "github_installation",
      expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      token: state,
      userId,
    });

    // Split base URL and return URL to keep lines short and readable
    // @ts-expect-error unknown type
    const baseUrl = `https://github.com/apps/${integration.data.slug}/installations/new`;
    return `${baseUrl}?state=${encodeURIComponent(state)}`;
  }

  async githubInstallCallback(payload: InstallCallbackPayload) {
    const [state] = await this.db
      .select()
      .from(RedirectStateTable)
      .where(
        and(
          eq(RedirectStateTable.token, payload.state),
          gt(
            RedirectStateTable.expiresAt,
            new Date(Date.now() - 1000 * 60 * 15),
          ),
        ),
      );
    if (!state) {
      throw new LinaError(LinaErrorType.INVALID_STATE);
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(RedirectStateTable)
        .where(eq(RedirectStateTable.id, state.id))
        .execute();

      if (payload.setup_action === "install") {
        await tx
          .update(IntegrationTable)
          .set({
            data: sql`
              jsonb_set(${IntegrationTable.data}, '{installationId}', to_jsonb(${payload.installation_id}::bigint))
            `,
          })
          .where(
            and(
              eq(IntegrationTable.userId, state.userId),
              eq(IntegrationTable.type, "github_app"),
            ),
          );
      }
    });
  }
}
