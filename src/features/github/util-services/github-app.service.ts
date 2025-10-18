import { Injectable, Logger } from "@nestjs/common";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { GithubConfig, IGithubConfig } from "src/configs/github.config";
import { LinaError, LinaErrorType } from "src/filters/exception";
import * as tmp from "tmp-promise";
import * as fs from "node:fs/promises";

@Injectable()
export class GithubAppService {
  private logger = new Logger(GithubAppService.name);

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

  // Clones a GitHub repository to a temporary folder,
  // moves the specified root directory to the target path, and cleans up.
  async cloneRepo(
    installationId: number,
    repo: string,
    owner: string,
    branch: string,
    targetPath: string,
    rootDir: string,
  ) {
    this.logger.log(`Cloning repo ${repo} from ${owner} at branch ${branch}`);
    const cloneTmpDir = await tmp.dir({ unsafeCleanup: true });

    try {
      const appAuth = createAppAuth({
        appId: this.githubConfig.appId,
        privateKey: this.githubConfig.privateKey!,
        installationId,
      });
      const { token } = await appAuth({
        type: "installation",
        installationId,
      });

      const cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
      /*
        Includes the repo name in the clone destination path to prevent the `fs.rename` method
        from moving and deleting the entire folder when `rootDir` is "/".
      */
      const cloneDestPath = path.join(cloneTmpDir.path, repo);
      const cloneCommand = `git clone --depth 1 --branch ${branch} --single-branch ${cloneUrl} ${cloneDestPath}`;
      execSync(cloneCommand, {
        stdio: "pipe",
        maxBuffer: 1024 * 1024 * 300,
      });

      await fs.rm(path.join(cloneDestPath, ".git"), {
        recursive: true,
        force: true,
      });

      const sourcePath = path.join(cloneDestPath, rootDir);
      await fs.rename(sourcePath, targetPath);
    } catch (error) {
      throw new LinaError(LinaErrorType.GITHUB_DOWNLOAD_ERROR, error);
    } finally {
      await cloneTmpDir.cleanup();
    }
  }
}
