import { Inject, Injectable } from "@nestjs/common";
import { IOrchestrationService } from "./interfaces/service";
import { GithubAppService } from "../github/util-services/github-app.service";
import { AUTO_DEPLOY_TRIGGER, DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { StartAppDeployment } from "./dtos";
import {
  HostEnvTable,
  HostTable,
  RepositoryBranchTable,
  RepositoryTable,
} from "src/drizzle/schemas";
import { eq } from "drizzle-orm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { BUILD_EVENTS } from "src/worker/constants";
import { DEFAULT_PORT } from "./constants";
import { BuildAndPushDockerImage } from "../build/types/types";

@Injectable()
export class OrchestrationService implements IOrchestrationService {
  constructor(
    @Inject(DATABASE) private db: Database,
    private githubAppService: GithubAppService,
    private eventEmitter: EventEmitter2,
  ) {}

  async startAppDeployment(
    userId: string,
    repositoryId: string,
    payload: StartAppDeployment,
  ): Promise<void> {
    const repository = await this.db.query.RepositoryTable.findFirst({
      where: eq(RepositoryTable.id, repositoryId),
      with: {
        owner: true,
        branches: {
          where: eq(RepositoryBranchTable.id, payload.branchId),
        },
      },
    });

    await this.db.transaction(async (tx) => {
      const [host] = await tx
        .insert(HostTable)
        .values({
          ...payload,
          userId,
          repositoryId,
          slug: payload.name.replace(/\s+/g, "-").toLowerCase(),
          port: DEFAULT_PORT,
          autoDeploy: true,
          autoDeployTrigger:
            payload.autoDeployTrigger || AUTO_DEPLOY_TRIGGER.PUSH,
          baseDir: "./",
        })
        .returning();

      await Promise.all(
        payload.hostEnv.map(async (env) => {
          return tx.insert(HostEnvTable).values({
            hostId: host.id,
            name: env.name,
            value: env.value,
          });
        }),
      );

      this.eventEmitter.emit(BUILD_EVENTS.BUILD_AND_PUSH_DOCKER_IMAGE, <
        BuildAndPushDockerImage
      >{
        host,
        installationId: repository!.owner.installationId,
        repo: repository!,
        branche: repository?.branches[0],
        env: "node",
      });
    });
  }
}
