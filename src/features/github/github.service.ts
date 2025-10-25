// import { Inject, Injectable } from "@nestjs/common";
// import { IGithubService } from "./interfaces/service";
// import { GithubConfig, IGithubConfig } from "src/configs/github.config";
// import { generateState } from "src/utils/state";
// import { DATABASE } from "src/drizzle/constants";
// import { Database } from "src/drizzle/types";
// import {
//   OAuthAccountTable,
//   RepositoryBranchTable,
//   RepositoryTable,
// } from "src/drizzle/schemas";
// import { InstallationCallbackPayload } from "./dto";
// import { eq } from "drizzle-orm";
// import { LinaError, LinaErrorType } from "src/filters/exception";
// import { GithubAppStateTable } from "src/drizzle/schemas/github-app-state.schema";
// import { GithubUtilService } from "./util-services/util.service";

// @Injectable()
// export class GithubService implements IGithubService {
//   constructor(
//     @GithubConfig() private githubConfig: IGithubConfig,
//     @Inject(DATABASE) private db: Database,
//     private githubUtilService: GithubUtilService,
//   ) {}

//   async generateInstallationUrl(userId: string) {
//     const state = generateState();
//     const [githubAccount] = await this.db
//       .select()
//       .from(OAuthAccountTable)
//       .where(eq(OAuthAccountTable.userId, userId));
//     if (!githubAccount) {
//       throw new LinaError(LinaErrorType.NOT_REGISTERED);
//     }

//     await this.db
//       .insert(GithubAppStateTable)
//       .values({
//         providerId: githubAccount.id,
//         state,
//       })
//       .execute();

//     return `https://github.com/apps/${this.githubConfig.appSlug}/installations/new?state=${encodeURIComponent(state)}`;
//   }

//   /*
//     Handles GitHub app installation or update. Adds selected repositories to the database
//     and updates the installation ID for new installations. For updates, removes only repositories
//     whose permissions have been revoked and adds new ones.
//   */
//   async installationCallback(payload: InstallationCallbackPayload) {
//     const [state] = await this.db
//       .select({
//         githubAppState: GithubAppStateTable,
//         user: OAuthAccountTable,
//       })
//       .from(GithubAppStateTable)
//       .innerJoin(
//         OAuthAccountTable,
//         eq(OAuthAccountTable.id, GithubAppStateTable.providerId),
//       )
//       .where(eq(GithubAppStateTable.state, payload.state));

//     if (!state) {
//       throw new LinaError(LinaErrorType.NOT_FOUND, "STATE_NOT_FOUND");
//     }

//     const installationRepos = await this.githubUtilService.getInstallationRepos(
//       payload.installation_id,
//     );

//     const existingRepos = await this.db
//       .select()
//       .from(RepositoryTable)
//       .where(eq(RepositoryTable.ownerId, state.user.id));

//     const reposToAdd = installationRepos.filter((iRepo) =>
//       existingRepos.every((xRepo) => xRepo.providerId !== iRepo.id),
//     );
//     const reposToRemove = existingRepos.filter((xRepo) =>
//       installationRepos.every((iRepo) => iRepo.id !== xRepo.providerId),
//     );

//     /*
//       Adds selected repositories to the database
//       and updates the installation ID for new installations.
//       For updates, removes only repositories whose permissions have been revoked and adds new ones.
//     */
//     await this.db.transaction(async (tx) => {
//       await tx
//         .delete(GithubAppStateTable)
//         .where(eq(GithubAppStateTable.id, state.githubAppState.id))
//         .execute();

//       if (payload.setup_action === "install") {
//         if (state.user.installationId) {
//           throw new LinaError(LinaErrorType.GITHUB_APP_ALREADY_INSTALLED);
//         }
//         await tx
//           .update(OAuthAccountTable)
//           .set({ installationId: payload.installation_id })
//           .where(eq(OAuthAccountTable.id, state.user.id))
//           .execute();
//       } else if (payload.setup_action === "update") {
//         // removes repositories with revoked permissions
//         await Promise.all(
//           reposToRemove.map((repo) => {
//             return tx
//               .delete(RepositoryTable)
//               .where(eq(RepositoryTable.providerId, repo.providerId))
//               .execute();
//           }),
//         );
//       }

//       // insert repos and repos branches
//       for (const repo of reposToAdd) {
//         const [repoResult] = await tx
//           .insert(RepositoryTable)
//           .values({
//             name: repo.name,
//             fullName: repo.full_name,
//             isPrivate: repo.private,
//             isFork: repo.fork,
//             url: repo.url,
//             ownerId: state.user.id,
//             providerId: repo.id,
//           })
//           .onConflictDoNothing()
//           .returning({ id: RepositoryTable.id });

//         await Promise.all(
//           repo.branches.map(async (branch) => {
//             await tx.insert(RepositoryBranchTable).values({
//               repositoryId: repoResult.id,
//               ...branch,
//             });
//           }),
//         );
//       }
//     });
//   }
// }
