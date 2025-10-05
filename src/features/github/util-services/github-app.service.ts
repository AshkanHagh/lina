import { Injectable } from "@nestjs/common";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { GithubConfig, IGithubConfig } from "src/configs/github.config";
import { LinaError, LinaErrorType } from "src/filters/exception";

@Injectable()
export class GithubAppService {
  constructor(@GithubConfig() private githubConfig: IGithubConfig) {}

  async createRestClient(installationId: number): Promise<Octokit> {
    const appAuth = createAppAuth({
      appId: this.githubConfig.appId,
      privateKey: this.githubConfig.privateKey!,
      installationId,
    });

    const installationAuth = await appAuth({
      type: "installation",
      installationId,
    });
    return new Octokit({ auth: installationAuth.token });
  }

  // gets all repositories that a GitHub app installation can access using the installation ID.
  // returns a list of repository details from GitHub.
  async getInstallationRepos(octokit: Octokit) {
    try {
      const result =
        await octokit.rest.apps.listReposAccessibleToInstallation();

      return result.data.repositories;
    } catch (error) {
      throw new LinaError(LinaErrorType.GITHUB_APP_INSTALLATION, error);
    }
  }

  // TODO: remove duplicated
  async getReposBranches(
    octokit: Octokit,
    repo: { name: string; owner: string; defaultBranch: string },
  ) {
    try {
      const branches = await octokit.repos.listBranches({
        owner: repo.owner,
        repo: repo.name,
      });
      return branches.data.map((branch) => ({
        ...branch,
        isDefault: branch.name === repo.defaultBranch,
      }));
    } catch (error) {
      throw new LinaError(LinaErrorType.GITHUB_APP_INSTALLATION, error);
    }
  }
}
