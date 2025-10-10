import { Inject } from "@nestjs/common";
import { ConfigType, registerAs } from "@nestjs/config";

export const dockerConfig = registerAs("docker", () => {
  return {
    host: process.env.DOCKER_HOST,
    port: process.env.DOCKER_PORT || 2375,
    registry: {
      name: process.env.DOCKER_REGISTRY_NAME,
      url: process.env.DOCKER_REGISTRY_URL,
      username: process.env.DOCKER_REGISTRY_USERNAME,
      password: process.env.DOCKER_REGISTRY_PASSWORD,
    },
  };
});

export const DockerConfig = () => Inject(dockerConfig.KEY);
export type IDockerConfig = ConfigType<typeof dockerConfig>;
