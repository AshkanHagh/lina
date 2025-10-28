import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { IGithubService } from "./interfaces/service";
import { CreateGithubAppPayload, RedirectToGithubPayload } from "./dto";
import { generateState } from "src/utils/state";
import { SettingTable, StateTable } from "src/drizzle/schemas";
import { eq } from "drizzle-orm";
import { API_PREFIX } from "src/constants/global.constant";

@Injectable()
export class GithubService implements IGithubService {
  constructor(@Inject(DATABASE) private db: Database) {}

  async createGithubApp(payload: CreateGithubAppPayload) {
    const [appUrl] = await this.db
      .select()
      .from(SettingTable)
      .where(eq(SettingTable.key, "APP_URL"));

    const manifest = {
      name: payload.name,
      url: appUrl.value,
      hook_attributes: {
        url: `${appUrl.value}/${API_PREFIX}/webhooks/github`,
        active: true,
      },
      redirect_url: `${appUrl.value}/${API_PREFIX}/github/app/callback`,
      description: "TODO",
      public: false,
      default_permissions: {
        contents: "read",
        metadata: "read",
      },
      default_events: ["push", "repository"],
    };

    const state = generateState();
    await this.db.insert(StateTable).values({
      state,
      expiredAt: new Date(Date.now() + 1000 * 60 * 10),
    });

    const manifestParam = encodeURIComponent(JSON.stringify(manifest));
    return `${appUrl.value}/${API_PREFIX}/github/app/redirect?state=${state}&manifest=${manifestParam}`;
  }

  /*
   Returns HTML with auto-submitting form that POSTs to GitHub.
   This is needed because GitHub requires POST (not GET) for app creation.
   **NOTE: This implementation is ONLY for backend testing purposes.**
  */
  redirectToGithub(payload: RedirectToGithubPayload) {
    return `
      <form action="https://github.com/settings/apps/new?state=${payload.state}" method="post" id="f">
        <input type="hidden" name="manifest" value='${decodeURIComponent(payload.manifest)}'>
        <script>document.getElementById('f').submit();</script>
      </form>
    `;
  }

  // async generateInstallationUrl(userId: string) {
  //   const state = generateState();
  //   const [githubAccount] = await this.db
  //     .select()
  //     .from(OAuthAccountTable)
  //     .where(eq(OAuthAccountTable.userId, userId));
  //   if (!githubAccount) {
  //     throw new LinaError(LinaErrorType.NOT_REGISTERED);
  //   }

  //   await this.db
  //     .insert(GithubAppStateTable)
  //     .values({
  //       providerId: githubAccount.id,
  //       state,
  //     })
  //     .execute();

  //   return `https://github.com/apps/${this.githubConfig.appSlug}/installations/new?state=${encodeURIComponent(state)}`;
  // }

  // /*
  //   Handles GitHub app installation or update. Adds selected repositories to the database
  //   and updates the installation ID for new installations. For updates, removes only repositories
  //   whose permissions have been revoked and adds new ones.
  // */
  // async installationCallback(payload: InstallationCallbackPayload) {
  //   const [state] = await this.db
  //     .select({
  //       githubAppState: GithubAppStateTable,
  //       user: OAuthAccountTable,
  //     })
  //     .from(GithubAppStateTable)
  //     .innerJoin(
  //       OAuthAccountTable,
  //       eq(OAuthAccountTable.id, GithubAppStateTable.providerId),
  //     )
  //     .where(eq(GithubAppStateTable.state, payload.state));

  //   if (!state) {
  //     throw new LinaError(LinaErrorType.NOT_FOUND, "STATE_NOT_FOUND");
  //   }

  //   const installationRepos = await this.githubUtilService.getInstallationRepos(
  //     payload.installation_id,
  //   );

  //   const existingRepos = await this.db
  //     .select()
  //     .from(RepositoryTable)
  //     .where(eq(RepositoryTable.ownerId, state.user.id));

  //   const reposToAdd = installationRepos.filter((iRepo) =>
  //     existingRepos.every((xRepo) => xRepo.providerId !== iRepo.id),
  //   );
  //   const reposToRemove = existingRepos.filter((xRepo) =>
  //     installationRepos.every((iRepo) => iRepo.id !== xRepo.providerId),
  //   );

  //   /*
  //     Adds selected repositories to the database
  //     and updates the installation ID for new installations.
  //     For updates, removes only repositories whose permissions have been revoked and adds new ones.
  //   */
  //   await this.db.transaction(async (tx) => {
  //     await tx
  //       .delete(GithubAppStateTable)
  //       .where(eq(GithubAppStateTable.id, state.githubAppState.id))
  //       .execute();

  //     if (payload.setup_action === "install") {
  //       if (state.user.installationId) {
  //         throw new LinaError(LinaErrorType.GITHUB_APP_ALREADY_INSTALLED);
  //       }
  //       await tx
  //         .update(OAuthAccountTable)
  //         .set({ installationId: payload.installation_id })
  //         .where(eq(OAuthAccountTable.id, state.user.id))
  //         .execute();
  //     } else if (payload.setup_action === "update") {
  //       // removes repositories with revoked permissions
  //       await Promise.all(
  //         reposToRemove.map((repo) => {
  //           return tx
  //             .delete(RepositoryTable)
  //             .where(eq(RepositoryTable.providerId, repo.providerId))
  //             .execute();
  //         }),
  //       );
  //     }

  //     // insert repos and repos branches
  //     for (const repo of reposToAdd) {
  //       const [repoResult] = await tx
  //         .insert(RepositoryTable)
  //         .values({
  //           name: repo.name,
  //           fullName: repo.full_name,
  //           isPrivate: repo.private,
  //           isFork: repo.fork,
  //           url: repo.url,
  //           ownerId: state.user.id,
  //           providerId: repo.id,
  //         })
  //         .onConflictDoNothing()
  //         .returning({ id: RepositoryTable.id });

  //       await Promise.all(
  //         repo.branches.map(async (branch) => {
  //           await tx.insert(RepositoryBranchTable).values({
  //             repositoryId: repoResult.id,
  //             ...branch,
  //           });
  //         }),
  //       );
  //     }
  //   });
  // }
}
