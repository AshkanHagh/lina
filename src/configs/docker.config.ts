import { Inject } from "@nestjs/common";
import { ConfigType, registerAs } from "@nestjs/config";

export const dockerConfig = registerAs("docker", () => {
  return {
    socketPath: process.env.DOCKER_SOCKET_PATH,
    isLocal: process.env.DOCKER_IS_LOCAL === "true",
    host: process.env.DOCKER_HOST,
    port: process.env.DOCKER_PORT || 2375,
    registry: {
      url: process.env.DOCKER_REGISTRY_URL,
      host: process.env.DOCKER_REGISTRY_HOST,
      username: process.env.DOCKER_REGISTRY_USERNAME,
      password: process.env.DOCKER_REGISTRY_PASSWORD,
    },
  };
});

export const DockerConfig = () => Inject(dockerConfig.KEY);
export type IDockerConfig = ConfigType<typeof dockerConfig>;
