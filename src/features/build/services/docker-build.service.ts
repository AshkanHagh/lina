import { LinaError, LinaErrorType } from "src/filters/exception";
import * as tar from "tar-fs";
import * as path from "node:path";
import { Dockerignore } from "src/templates/docker/dockerignore";
import * as Dockerode from "dockerode";
import { DockerConfig, IDockerConfig } from "src/configs/docker.config";
import { Injectable, Logger } from "@nestjs/common";
import { writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { AppEnv } from "src/drizzle/schemas";
import { DockerStream } from "../types/types";

@Injectable()
export class DockerBuildService {
  private docker: Dockerode;
  private logger = new Logger(DockerBuildService.name);

  constructor(@DockerConfig() private dockerConfig: IDockerConfig) {
    this.docker = new Dockerode({
      host: this.dockerConfig.host,
      port: this.dockerConfig.port,
      socketPath: this.dockerConfig.socketPath,
    });
  }

  async buildImage(
    repoDir: string,
    env: AppEnv,
    imageName: string,
    imageTag: string,
    installCommand?: string,
    buildCommand?: string,
    startCommand?: string,
    dockerfilePath?: string,
  ) {
    try {
      // only write docker files when no dockerfile provided
      if (env !== "docker") {
        await this.createDockerFiles(repoDir);
      }

      // renaming manually included dockerfiles
      const tarStream = tar.pack(repoDir, {
        map: (header) => {
          if (
            header.name === "Dockerfile.tmp" ||
            header.name === ".dockerignore.tmp"
          ) {
            header.name = header.name.replace(".tmp", "");
          }
          return header;
        },
      });

      const stream = await this.docker.buildImage(tarStream, {
        buildargs: this.buildDockerfileArgs(
          env,
          installCommand,
          buildCommand,
          startCommand,
        ),
        t: `${imageName}:${imageTag}`,
        dockerfile: dockerfilePath,
        // nocache: true,
      });
      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(
          stream,
          (err, res) => (err ? reject(err) : resolve(res)),
          (event: DockerStream) =>
            process.stdout.write(event.stream || event.error || ""),
        );
      });
    } catch (error) {
      throw new LinaError(LinaErrorType.DOCKER_BUILD_ERROR, error);
    }
  }

  async pushImage(name: string, tag: string) {
    try {
      const imageName = `${name}:${tag}`;
      const repo = `${this.dockerConfig.registry.host}/${this.dockerConfig.registry.username}/${name}`;
      const fullRegistryTag = `${repo}:${tag}`;

      const image = this.docker.getImage(imageName);
      await image.tag({ repo, tag });
      const taggedImage = this.docker.getImage(fullRegistryTag);

      const stream = await taggedImage.push({
        authconfig: {
          username: this.dockerConfig.registry.username,
          password: this.dockerConfig.registry.password,
          serveraddress: this.dockerConfig.registry.url,
        },
      });

      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(
          stream,
          (err, res) => (err ? reject(err) : resolve(res)),
          (event: DockerStream) => {
            if (event.status && !event.progress) {
              process.stdout.write(event.status + "\n");
            }
            if (event.progress) {
              process.stdout.write(event.progress + "\n");
            }
            if (event.error) {
              process.stdout.write(event.error + "\n");
            }
          },
        );
      });
    } catch (error) {
      throw new LinaError(LinaErrorType.DOCKER_BUILD_ERROR, error);
    }
  }

  private async createDockerFiles(repoPath: string) {
    try {
      const command = `new-dockerfile > Dockerfile.tmp`;
      execSync(command, {
        cwd: repoPath,
        stdio: "inherit",
      });

      const dockerignorePath = path.join(repoPath, ".dockerignore.tmp");
      await writeFile(dockerignorePath, Dockerignore);
    } catch (error) {
      throw new LinaError(LinaErrorType.DOCKER_BUILD_ERROR, error);
    }
  }

  private buildDockerfileArgs(
    env: AppEnv,
    installCommand?: string,
    buildCommand?: string,
    startCommand?: string,
  ) {
    // new-dockerfile dockerfile args for each env
    const args: Record<AppEnv, Record<string, string | undefined>> = {
      // ignore because we use user dockerfile
      docker: {},
      node: {
        ["INSTALL_CMD"]: installCommand,
        ["BUILD_CMD"]: buildCommand,
        ["START_CMD"]: startCommand,
      },
    };

    const result = args[env];
    const filteredResult: Record<string, string> = {};

    for (const [key, value] of Object.entries(result)) {
      if (value !== undefined) {
        filteredResult[key] = value;
      }
    }

    return filteredResult;
  }
}
