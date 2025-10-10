import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { OrchestrationService } from "./orchestration.service";
import { IOrchestrationController } from "./interfaces/controller";
import { StartAppDeploymentDto } from "./dtos";
import { User } from "../auth/decorators/user.decorator";
import { AuthorizationGuard } from "../auth/guards/authorization.guard";

@Controller("orchestration")
@UseGuards(AuthorizationGuard)
export class OrchestrationController implements IOrchestrationController {
  constructor(private readonly orchestrationService: OrchestrationService) {}

  @Post("/start/:repository_id")
  async startAppDeployment(
    @User("id") userId: string,
    @Param("repository_id", new ParseUUIDPipe()) repositoryId: string,
    @Body() payload: StartAppDeploymentDto,
  ): Promise<void> {
    await this.orchestrationService.startAppDeployment(
      userId,
      repositoryId,
      payload,
    );
  }
}
