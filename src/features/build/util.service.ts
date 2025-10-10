import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import { GithubAppService } from "../github/util-services/github-app.service";
import path from "node:path";
import fs from "node:fs/promises";
import { Logger } from "@nestjs/common";

export class BuildUtilService {
  private logger = new Logger(BuildUtilService.name);

  constructor(private githubAppService: GithubAppService) {}

  async downloadContents(
    octokit: Octokit,
    content: RestEndpointMethodTypes["repos"]["getContent"]["response"]["data"],
    localPath: string,
    repo: RestEndpointMethodTypes["repos"]["getContent"]["parameters"],
  ) {
    const items = Array.isArray(content) ? content : [content];
    for (const item of items) {
      const itemPath = path.join(localPath, item.name);

      if (item.type === "file") {
        const { data } = await octokit.repos.getContent({
          ...repo,
          path: item.path,
        });

        // @ts-expect-error cant type cast that data is of type file
        const content = Buffer.from(data.content as string, "base64");
        await fs.writeFile(itemPath, content);

        this.logger.log(`Downloaded: ${item.path}`);
      } else if (item.type === "dir") {
        await fs.mkdir(itemPath, { recursive: true });
        const { data: dirContents } = await octokit.repos.getContent({
          ...repo,
          path: item.path,
        });

        await this.downloadContents(octokit, dirContents, itemPath, repo);
      }
    }
  }
}
