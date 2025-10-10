import { StartAppDeploymentDto } from "../dtos";

export interface IOrchestrationController {
  startAppDeployment(
    userId: string,
    repositoryId: string,
    payload: StartAppDeploymentDto,
  ): Promise<void>;
}
