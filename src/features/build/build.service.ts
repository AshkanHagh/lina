import { Injectable, Logger } from "@nestjs/common";
import { IBuildService } from "./interfaces/service";
import { BuildAndPushDockerImage } from "./types/types";
import { GithubAppService } from "../github/util-services/github-app.service";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { BuildUtilService } from "./util.service";
import * as tmp from "tmp-promise";
import { DockerBuildService } from "./services/docker-build.service";

@Injectable()
export class BuildService implements IBuildService {
  private logger = new Logger(BuildService.name);

  constructor(
    private githubAppService: GithubAppService,
    private buildUtilServide: BuildUtilService,
    private dockerBuildService: DockerBuildService,
  ) {}

  async BuildAndPushDockerImage(payload: BuildAndPushDockerImage) {
    this.logger.log(`start building docker image for ${payload.repo.name}`);
    await this.buildUtilServide.updateBuildStatus(payload.buildId, {
      status: "RUNNING",
    });

    const tmpDir = await tmp.dir({ unsafeCleanup: true });
    try {
      await this.githubAppService.cloneRepo(
        payload.installationId,
        payload.repo.name,
        payload.repo.owner,
        payload.repo.branch,
        tmpDir.path,
        payload.repo.path,
      );

      await this.dockerBuildService.buildImage(
        tmpDir.path,
        payload.dockerfilePath || "Dockerfile",
        payload.imageName,
        payload.repo.commitSha,
        payload.env,
      );
      // await this.dockerBuildService.pushImage(payload.host.slug);
    } catch (error) {
      await this.buildUtilServide.updateBuildStatus(payload.buildId, {
        status: "RUNNING",
        // eslint-disable-next-line
        error: error.message,
      });
      throw new LinaError(LinaErrorType.DOCKER_BUILD_ERROR, error);
    } finally {
      await tmpDir.cleanup();
    }

    await this.buildUtilServide.updateBuildStatus(payload.buildId, {
      status: "COMPLETED",
    });
  }
}
