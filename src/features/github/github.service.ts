import { Inject, Injectable } from "@nestjs/common";
import { IGithubService } from "./interfaces/service";
import { GithubConfig, IGithubConfig } from "src/configs/github.config";
import { generateState } from "src/utils/state";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { OAuthAccountTable, RepositoryTable } from "src/drizzle/schemas";
import { InstallationCallbackPayload } from "./dto";
import { eq } from "drizzle-orm";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { GithubAppService } from "./util-services/github-app.service";
import { GithubAppStateTable } from "src/drizzle/schemas/github-app-state.schema";

@Injectable()
export class GithubService implements IGithubService {
  constructor(
    @GithubConfig() private githubConfig: IGithubConfig,
    @Inject(DATABASE) private db: Database,
    private githubAppService: GithubAppService,
  ) {}

  async generateInstallationUrl(userId: string) {
    const state = generateState();
    const [githubAccount] = await this.db
      .select()
      .from(OAuthAccountTable)
      .where(eq(OAuthAccountTable.userId, userId));
    if (!githubAccount) {
      throw new LinaError(LinaErrorType.NOT_REGISTERED);
    }

    await this.db
      .insert(GithubAppStateTable)
      .values({
        providerId: githubAccount.id,
        state,
      })
      .execute();

    return `https://github.com/apps/${this.githubConfig.appSlug}/installations/new?state=${encodeURIComponent(state)}`;
  }

  // Handles GitHub app installation or update. Adds selected repositories to the database
  // for new installations and updates the installation ID. For updates, replaces existing
  // repositories with the new selection.
  async installationCallback(payload: InstallationCallbackPayload) {
    const [state] = await this.db
      .select()
      .from(GithubAppStateTable)
      .innerJoin(
        OAuthAccountTable,
        eq(OAuthAccountTable.id, GithubAppStateTable.providerId),
      )
      .where(eq(GithubAppStateTable.state, payload.state));

    if (!state) {
      throw new LinaError(LinaErrorType.NOT_FOUND, "STATE_NOT_FOUND");
    }

    const repositories = await this.githubAppService.getInstallationRepos(
      payload.installation_id,
    );

    await this.db.transaction(async (tx) => {
      await tx
        .delete(GithubAppStateTable)
        .where(eq(GithubAppStateTable.id, state.github_app_states.id))
        .execute();

      if (payload.setup_action === "install") {
        if (state.oauth_accounts.installationId) {
          throw new LinaError(LinaErrorType.GITHUB_APP_ALREADY_INSTALLED);
        }
        await tx
          .update(OAuthAccountTable)
          .set({ installationId: payload.installation_id })
          .where(eq(OAuthAccountTable.id, state.oauth_accounts.id))
          .execute();
      } else {
        await tx
          .delete(RepositoryTable)
          .where(eq(RepositoryTable.ownerId, state.oauth_accounts.id))
          .execute();
      }

      await Promise.all(
        repositories.map(async (repo) => {
          return tx.insert(RepositoryTable).values({
            name: repo.name,
            fullName: repo.full_name,
            isPrivate: repo.private,
            isFork: repo.fork,
            url: repo.url,
            defaultBranch: repo.default_branch,
            ownerId: state.oauth_accounts.id,
            providerId: repo.id,
          });
        }),
      );
    });
  }
}
