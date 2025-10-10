import { StartAppDeployment } from "../dtos";

export interface IOrchestrationService {
  startAppDeployment(
    userId: string,
    repositoryId: string,
    payload: StartAppDeployment,
  ): Promise<void>;
}
