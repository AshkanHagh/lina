// import { Injectable, Logger } from "@nestjs/common";
// import { IBuildService } from "./interfaces/service";
// import { BuildAndPushDockerImage } from "./types/types";
// import { GithubAppService } from "../github/util-services/github-app.service";
// import { LinaError, LinaErrorType } from "src/filters/exception";
// import { BuildUtilService } from "./util.service";
// import * as tmp from "tmp-promise";
// import { DockerBuildService } from "./services/docker-build.service";
// import { parseError } from "src/utils/error-parser";

// @Injectable()
// export class BuildService implements IBuildService {
//   private logger = new Logger(BuildService.name);

//   constructor(
//     private githubAppService: GithubAppService,
//     private buildUtilServide: BuildUtilService,
//     private dockerBuildService: DockerBuildService,
//   ) {}

//   async BuildAndPushDockerImage(payload: BuildAndPushDockerImage) {
//     this.logger.log(`start building docker image for ${payload.repo.name}`);
//     await this.buildUtilServide.updateBuildStatus(payload.buildId, {
//       status: "RUNNING",
//     });

//     const tmpDir = await tmp.dir({ unsafeCleanup: true });
//     try {
//       await this.githubAppService.cloneRepo(
//         payload.installationId,
//         payload.repo.name,
//         payload.repo.owner,
//         payload.repo.branch,
//         tmpDir.path,
//         payload.repo.path,
//       );

//       const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//       const imageTag = `${payload.repo.commitSha}-${timestamp}`;

//       await this.dockerBuildService.buildImage(
//         tmpDir.path,
//         payload.env,
//         payload.imageName,
//         imageTag,
//         payload.installCommand,
//         payload.buildCommand,
//         payload.startCommand,
//         payload.dockerfilePath || "Dockerfile",
//       );
//       await this.dockerBuildService.pushImage(payload.imageName, imageTag);
//     } catch (error) {
//       await this.buildUtilServide.updateBuildStatus(payload.buildId, {
//         status: "RUNNING",
//         error: parseError(error),
//         endTime: new Date(),
//       });
//       throw new LinaError(LinaErrorType.DOCKER_BUILD_ERROR, error);
//     } finally {
//       await tmpDir.cleanup();
//     }

//     await this.buildUtilServide.updateBuildStatus(payload.buildId, {
//       status: "COMPLETED",
//       endTime: new Date(),
//     });
//   }
// }
