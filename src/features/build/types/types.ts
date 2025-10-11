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
  env: string;
  imageName: string;
  dockerfilePath?: string;
};
