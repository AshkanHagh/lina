import { AppEnv } from "src/drizzle/schemas";

export type BuildAndPushDockerImage = {
  buildId: string;
  repo: {
    id: string;
    owner: string;
    name: string;
    path: string;
    branch: string;
    commitSha: string;
  };
  installationId: number;
  env: AppEnv;
  imageName: string;
  dockerfilePath?: string;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
};

export interface DockerStream {
  stream?: string;
  error?: string;
  status?: string;
  progress?: string;
  id?: string;
  aux?: any;
  [key: string]: any;
}
