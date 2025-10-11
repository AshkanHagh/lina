import { Injectable } from "@nestjs/common";
import { IBuildService } from "./interfaces/service";
import { BuildAndPushDockerImage } from "./types/types";
import { GithubAppService } from "../github/util-services/github-app.service";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { BuildUtilService } from "./util.service";
import * as tmp from "tmp-promise";
import { DockerBuildService } from "./services/docker-build.service";

@Injectable()
export class BuildService implements IBuildService {
  constructor(
    private githubAppService: GithubAppService,
    private buildUtilServide: BuildUtilService,
    private dockerBuildService: DockerBuildService,
  ) {}

  async BuildAndPushDockerImage(payload: BuildAndPushDockerImage) {
    await this.buildUtilServide.updateBuildStatus(payload.buildId, {
      status: "RUNNING",
    });

    const octokit = await this.githubAppService.createRestClient(
      payload.installationId,
    );
    const tmpDir = await tmp.dir({ unsafeCleanup: true });
    try {
      const { data: repoContent } = await octokit.repos.getContent({
        owner: payload.repo.owner,
        repo: payload.repo.name,
        path: payload.repo.path,
        ref: payload.repo.branch,
      });

      await this.buildUtilServide.downloadContents(
        octokit,
        repoContent,
        tmpDir.path,
        {
          owner: payload.repo.owner,
          repo: payload.repo.name,
          path: payload.repo.path,
          ref: payload.repo.branch,
        },
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
      throw new LinaError(LinaErrorType.GITHUB_DOWNLOAD_ERROR, error);
    } finally {
      await tmpDir.cleanup();
    }

    await this.buildUtilServide.updateBuildStatus(payload.buildId, {
      status: "COMPLETED",
    });
  }
}
