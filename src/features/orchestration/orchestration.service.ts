// import { Inject, Injectable } from "@nestjs/common";
// import { IOrchestrationService } from "./interfaces/service";
// import { DATABASE } from "src/drizzle/constants";
// import { Database } from "src/drizzle/types";
// import { StartAppDeployment } from "./dtos";
// import {
//   BuildTable,
//   EnvTable,
//   HostEnvTable,
//   HostTable,
//   IHost,
//   RepositoryBranchTable,
//   RepositoryTable,
// } from "src/drizzle/schemas";
// import { eq } from "drizzle-orm";
// import { EventEmitter2 } from "@nestjs/event-emitter";
// import { BUILD_EVENTS } from "src/worker/constants";
// import { DEFAULT_PORT } from "./constants";
// import { BuildAndPushDockerImage } from "../build/types/types";
// import { LinaError, LinaErrorType } from "src/filters/exception";

// @Injectable()
// export class OrchestrationService implements IOrchestrationService {
//   constructor(
//     @Inject(DATABASE) private db: Database,
//     private eventEmitter: EventEmitter2,
//   ) {}

//   /*
//     starts the deployment of an application.
//     creates and configs host and host env
//     starts and sends the repo build event
//   */
//   async startAppDeployment(
//     userId: string,
//     repoId: string,
//     payload: StartAppDeployment,
//   ): Promise<IHost> {
//     const repo = await this.db.query.RepositoryTable.findFirst({
//       where: eq(RepositoryTable.id, repoId),
//       with: {
//         owner: true,
//         branches: {
//           where: eq(RepositoryBranchTable.id, payload.branchId),
//         },
//       },
//     });
//     if (!repo || repo.branches.length < 1) {
//       throw new LinaError(LinaErrorType.NOT_FOUND);
//     }
//     // checks user permission and user installationId
//     if (
//       repo.owner.userId !== userId ||
//       (repo.owner.userId === userId && !repo.owner.installationId)
//     ) {
//       throw new LinaError(LinaErrorType.FORBIDDEN);
//     }

//     const repoBranch = repo.branches[0];

//     const [env] = await this.db
//       .select({ name: EnvTable.name })
//       .from(EnvTable)
//       .where(eq(EnvTable.id, payload.envId));
//     if (!env) {
//       throw new LinaError(LinaErrorType.NOT_FOUND);
//     }

//     return await this.db.transaction(async (tx) => {
//       const [host] = await tx
//         .insert(HostTable)
//         .values({
//           ...payload,
//           userId,
//           repositoryId: repo.id,
//           slug: payload.name.replace(/\s+/g, "-").toLowerCase(),
//           port: DEFAULT_PORT,
//           autoDeploy: true,
//         })
//         .returning();

//       await Promise.all(
//         payload.hostEnv.map(async (env) => {
//           return tx.insert(HostEnvTable).values({
//             hostId: host.id,
//             name: env.name,
//             value: env.value,
//           });
//         }),
//       );

//       const [build] = await tx
//         .insert(BuildTable)
//         .values({
//           hostId: host.id,
//           commitSha: repoBranch.commitSha,
//           imageName: host.slug,
//           imageTag: repoBranch.commitSha,
//         })
//         .returning();

//       const buildPayload: BuildAndPushDockerImage = {
//         buildId: build.id,
//         env: env.name,
//         imageName: host.slug,
//         installationId: repo.owner.installationId!,
//         repo: {
//           branch: repoBranch.name,
//           commitSha: repoBranch.commitSha,
//           id: repo.id,
//           name: repo.name,
//           owner: repo.owner.login,
//           path: payload.rootDir,
//         },
//         installCommand: payload.installCommand,
//         buildCommand: payload.buildCommand,
//         startCommand: payload.startCommand,
//         dockerfilePath: payload.dockerfilePath,
//       };
//       this.eventEmitter.emit(
//         BUILD_EVENTS.BUILD_AND_PUSH_DOCKER_IMAGE,
//         buildPayload,
//       );

//       return host;
//     });
//   }
// }
