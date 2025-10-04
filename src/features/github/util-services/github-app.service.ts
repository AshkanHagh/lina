import { Injectable } from "@nestjs/common";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { GithubConfig, IGithubConfig } from "src/configs/github.config";
import { LinaError, LinaErrorType } from "src/filters/exception";

@Injectable()
export class GithubAppService {
  constructor(@GithubConfig() private githubConfig: IGithubConfig) {}

  // gets all repositories that a GitHub app installation can access using the installation ID.
  // returns a list of repository details from GitHub.
  async getInstallationRepos(installationId: number) {
    try {
      const appAuth = createAppAuth({
        appId: this.githubConfig.appId,
        privateKey: this.githubConfig.privateKey!,
        installationId,
      });

      const installationAuth = await appAuth({
        type: "installation",
        installationId,
      });
      const octokit = new Octokit({ auth: installationAuth.token });
      const result =
        await octokit.rest.apps.listReposAccessibleToInstallation();

      return result.data.repositories;
    } catch (error) {
      throw new LinaError(LinaErrorType.GITHUB_APP_INSTALLATION, error);
    }
  }
}
