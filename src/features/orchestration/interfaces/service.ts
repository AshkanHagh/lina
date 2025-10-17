import { IHost } from "src/drizzle/schemas";
import { StartAppDeployment } from "../dtos";

export interface IOrchestrationService {
  startAppDeployment(
    userId: string,
    repoId: string,
    payload: StartAppDeployment,
  ): Promise<IHost>;
}
