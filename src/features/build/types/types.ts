import {
  IOAuthAccount,
  Repository,
  IRepositoryBranch,
  IHost,
} from "src/drizzle/schemas";

export type BuildAndPushDockerImage = {
  installationId: number;
  repo: Repository & {
    owner: IOAuthAccount;
  };
  branche: IRepositoryBranch;
  env: string;
  host: IHost;
};
