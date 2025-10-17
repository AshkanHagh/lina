import { Injectable } from "@nestjs/common";
import { GithubAppService } from "./github-app.service";

@Injectable()
export class GithubUtilService {
  constructor(private githubAppService: GithubAppService) {}

  async getInstallationRepos(installationId: number) {
    const octokit =
      await this.githubAppService.createRestClient(installationId);

    const repos = await this.githubAppService.getInstallationRepos(octokit);
    const reposWithBranches = await Promise.all(
      repos.map(async (repo) => {
        const branches = await this.githubAppService.getReposBranches(octokit, {
          name: repo.name,
          owner: repo.owner.login,
          defaultBranch: repo.default_branch,
        });

        const branchesWithCommit = await Promise.all(
          branches.map(async (branch) => {
            const { data: repoCommits } = await octokit.repos.listCommits({
              owner: repo.owner.login,
              repo: repo.name,
              per_page: 1,
              sha: branch.name,
            });
            const latestCommitSha = repoCommits[0].sha.slice(0, 7);
            return {
              ...branch,
              commitSha: latestCommitSha,
            };
          }),
        );

        return {
          ...repo,
          branches: branchesWithCommit,
        };
      }),
    );

    return reposWithBranches;
  }
}
