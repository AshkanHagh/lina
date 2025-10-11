import { LinaError, LinaErrorType } from "src/filters/exception";
import * as tar from "tar-fs";
import path from "node:path";
import { Dockerignore } from "src/templates/dockerfile-templates/dockerignore";
import * as Dockerode from "dockerode";
import { DockerConfig, IDockerConfig } from "src/configs/docker.config";
import { Injectable } from "@nestjs/common";
import { DockerFiles } from "src/templates/dockerfile-templates";
import { writeFile } from "node:fs/promises";

@Injectable()
export class DockerBuildService {
  private docker: Dockerode;

  constructor(@DockerConfig() private dockerConfig: IDockerConfig) {
    this.docker = new Dockerode({
      socketPath: this.dockerConfig.socketPath,
    });
  }

  async buildImage(
    repoDir: string,
    dockerfilePath: string,
    imageName: string,
    commitSha: string,
    env: string,
  ) {
    try {
      // only write docker files when no dockerfile provided
      if (env !== "docker") {
        await this.createDockerFiles(env, repoDir);
      }

      const tarStream = tar.pack(repoDir, {
        // renaming manually included dockerfiles
        map: (header) => {
          if (header.name === "Dockerfile.tmp") {
            header.name = "Dockerfile";
          }
          if (header.name === ".dockerignore.tmp") {
            header.name = ".dockerignore";
          }
          return header;
        },
      });

      const stream = await this.docker.buildImage(tarStream, {
        t: `${imageName}:${commitSha}, ${imageName}:latest`,
        dockerfile: dockerfilePath,
      });

      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err, res) =>
          err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new LinaError(LinaErrorType.DOCKER_BUILD_ERROR, error);
    }
  }

  async pushImage(imageName: string) {
    try {
      const image = this.docker.getImage(imageName);

      const [name, tag] = imageName.split(":");
      const registeryImageName = `${this.dockerConfig.registry.url}/${this.dockerConfig.registry.username}/${name}`;
      const fullRegistryTag = `${registeryImageName}/${tag}`;

      await image.tag({ repo: registeryImageName, tag });
      const taggedImage = this.docker.getImage(fullRegistryTag);

      const stream = await taggedImage.push({
        authconfig: {
          username: this.dockerConfig.registry.username,
          password: this.dockerConfig.registry.password,
          serveraddress: this.dockerConfig.registry.url,
        },
      });

      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err, res) =>
          err ? reject(err) : resolve(res),
        );
      });
    } catch (error) {
      throw new LinaError(LinaErrorType.DOCKER_BUILD_ERROR, error);
    }
  }

  private async createDockerFiles(env: string, tmpPath: string) {
    const dockerfilePath = path.join(tmpPath, "Dockerfile.tmp");
    const dockerignorePath = path.join(tmpPath, ".dockerignore.tmp");

    const dockerfileContent = DockerFiles[env];

    await writeFile(dockerfilePath, dockerfileContent);
    await writeFile(dockerignorePath, Dockerignore);
  }
}
