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
    const octokit = await this.githubAppService.createRestClient(
      payload.installationId,
    );

    const tmpDir = await tmp.dir({ unsafeCleanup: true });
    try {
      const { data: repoContent } = await octokit.repos.getContent({
        owner: payload.repo.owner.login,
        repo: payload.repo.name,
        path: payload.host.rootDir,
        ref: payload.branche.name,
      });

      await this.buildUtilServide.downloadContents(
        octokit,
        repoContent,
        tmpDir.path,
        {
          owner: payload.repo.owner.login,
          repo: payload.repo.name,
          path: payload.host.rootDir,
          ref: payload.branche.name,
        },
      );

      await this.dockerBuildService.buildImage(
        tmpDir.path,
        payload.host.slug,
        payload.env,
      );
      await this.dockerBuildService.pushImage(payload.host.slug);
    } catch (error) {
      throw new LinaError(LinaErrorType.GITHUB_DOWNLOAD_ERROR, error);
    } finally {
      await tmpDir.cleanup();
    }
  }
}
