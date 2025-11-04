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
import { eq, sql } from "drizzle-orm";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { randomBytes } from "node:crypto";
import { Octokit } from "@octokit/rest";
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
    const [instanceUrl] = await this.db
      .select({ value: SettingTable.value })
      .from(SettingTable)
      .where(eq(SettingTable.key, "APP_URL"));

    const redirectUrl = `${instanceUrl.value}/api/v1/github/app/callback`;
    const setupUrl = `${instanceUrl.value}/api/v1/github/install/callback`;
    let webhookUrl = `${instanceUrl.value}/api/v1/Webhooks/github`;

    // in development, override webhook URL to use a separate HTTPS service (e.g., ngrok)
    if (process.env.NODE_ENV != "production") {
      const [webhookSetting] = await this.db
        .select({ value: SettingTable.value })
        .from(SettingTable)
        .where(eq(SettingTable.key, "GITHUB_WEBHOOK_URL"));
      webhookUrl = webhookSetting.value!;
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
          url: webhookUrl,
          active: true,
        },
        redirect_url: redirectUrl,
        setup_url: setupUrl,
        public: false,
        default_permissions: {
          contents: "read",
          metadata: "read",
        },
        default_events: ["push"],
      },
    };
  }

  /*
    validates the github manifest app creation callback from GitHub.
    exchanges the code for GitHub App credentials
  */
  async githubAppCallback(payload: GithubAppCallbackPayload) {
    const state = await this.db.query.RedirectStateTable.findFirst({
      where: (table, funcs) =>
        funcs.and(
          funcs.eq(table.token, payload.state),
          funcs.gt(table.expiresAt, new Date(Date.now() - 1000 * 60 * 15)),
        ),
    });
    if (!state) {
      throw new LinaError(LinaErrorType.INVALID_STATE);
    }

    let appCredentials: {
      pem: string;
      client_id: string;
      client_secret: string;
      id: number;
      slug?: string;
      name: string | null;
      webhook_secret: string | null;
      permissions: Record<string, unknown>;
    };

    // complete GitHub App creation handshake to get app credentials and details
    try {
      const result = await this.octokit.apps.createFromManifest({
        code: payload.code,
      });
      appCredentials = {
        ...result.data,
        pem: this.cryptr.encrypt(result.data.pem),
      };
    } catch (error) {
      throw new LinaError(LinaErrorType.GITHUB_APP_SETUP_FAILED, error);
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(RedirectStateTable)
        .where(eq(RedirectStateTable.id, state.id))
        .execute();

      await tx.insert(IntegrationTable).values({
        type: "GITHUB_APP",
        name: appCredentials.slug || appCredentials.name,
        data: <GithubAppDetails>{
          pem: appCredentials.pem,
          clientId: appCredentials.client_id,
          clientSecret: appCredentials.client_secret,
          id: appCredentials.id,
          slug: appCredentials.slug || appCredentials.name,
          webhookSecret: appCredentials.webhook_secret!,
          permissions: appCredentials.permissions,
        },
        userId: state.userId,
      });
    });
  }

  async setupGithubInstall(userId: string, appSlug: string): Promise<string> {
    const integration = await this.db.query.IntegrationTable.findFirst({
      where: (table, funcs) =>
        funcs.and(
          funcs.eq(table.type, "GITHUB_APP"),
          funcs.eq(table.name, appSlug),
          funcs.eq(table.userId, userId),
        ),
    });

    if (!integration) {
      throw new LinaError(LinaErrorType.GITHUB_APP_NOT_CREATED_OR_CONFIGURED);
    }

    const state = randomBytes(32).toString("hex");
    await this.db.insert(RedirectStateTable).values({
      flow: "github_installation",
      expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      token: state,
      data: {
        integrationId: integration.id,
      },
      userId,
    });

    // Split base URL and return URL to keep lines short and readable
    // eslint-disable-next-line
    const baseUrl = `https://github.com/apps/${integration.data.slug}/installations/new`;
    return `${baseUrl}?state=${encodeURIComponent(state)}`;
  }

  async githubInstallCallback(payload: InstallCallbackPayload) {
    const state = await this.db.query.RedirectStateTable.findFirst({
      where: (table, funcs) =>
        funcs.and(
          funcs.eq(table.token, payload.state),
          funcs.gt(table.expiresAt, new Date(Date.now() - 1000 * 60 * 15)),
        ),
    });
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
              jsonb_set(
                ${IntegrationTable.data},
                '{installationId}',
                to_jsonb(${payload.installation_id}::bigint)
              )
            `,
          })
          .where(eq(IntegrationTable.id, state.data!.integrationId as string));
      }
    });
  }

  async getGithubApp(
    userId: string,
    integrationId: string,
  ): Promise<Omit<GithubAppDetails, "pem">> {
    const integration = await this.db.query.IntegrationTable.findFirst({
      where: (table, funcs) =>
        funcs.and(
          funcs.eq(table.id, integrationId),
          funcs.eq(table.userId, userId),
        ),
      columns: {
        data: true,
      },
    });

    if (!integration) {
      throw new LinaError(LinaErrorType.INTEGRATION_NOT_FOUND);
    }

    const appDetails = integration.data as GithubAppDetails;
    // eslint-disable-next-line
    const { pem, ...rest } = appDetails;
    return rest;
  }
}
