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
      host: this.dockerConfig.host,
      port: this.dockerConfig.port,
    });
  }

  async buildImage(tmpPath: string, imageName: string, env: string) {
    try {
      await this.createDockerFiles(env, tmpPath);

      const tarStream = tar.pack(tmpPath, {
        ignore: (name) => {
          const relativePath = path.relative(tmpPath, name);
          const ignorePatterns = Dockerignore.split("\n");

          return ignorePatterns.some((pattern) => {
            if (!pattern || pattern.startsWith("#")) {
              return false;
            }

            if (pattern.endsWith("*")) {
              return relativePath.startsWith(pattern.slice(0, -1));
            }

            return (
              relativePath === pattern || relativePath.startsWith(pattern + "/")
            );
          });
        },
        map: (header) => {
          if (header.name === "Dockerfile.generated") {
            header.name = "Dockerfile";
          }
          if (header.name === ".dockerignore.generated") {
            header.name = ".dockerignore";
          }
          return header;
        },
      });

      const stream = await this.docker.buildImage(tarStream, {
        t: `${imageName}:latest`,
        dockerfile: "Dockerfile",
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

      const name = imageName.split(":")[0];
      const tag = imageName.split(":")[1];
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
    const dockerfilePath = path.join(tmpPath, "Dockerfile.generated");
    const dockerignorePath = path.join(tmpPath, ".dockerignore.generated");

    const dockerfileContent = DockerFiles[env];

    await writeFile(dockerfilePath, dockerfileContent);
    await writeFile(dockerignorePath, Dockerignore);
  }
}
