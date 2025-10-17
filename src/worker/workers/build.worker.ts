import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { BuildService } from "src/features/build/build.service";
import { BUILD_EVENTS } from "../constants";
import { BuildAndPushDockerImage } from "src/features/build/types/types";

@Injectable()
export class BuildWorker {
  private logger = new Logger(BuildWorker.name);

  constructor(private buildService: BuildService) {}

  @OnEvent(BUILD_EVENTS.BUILD_AND_PUSH_DOCKER_IMAGE)
  async handleImageBuildAndPush(event: BuildAndPushDockerImage) {
    this.logger.log(`event: ${BUILD_EVENTS.BUILD_AND_PUSH_DOCKER_IMAGE}`);
    try {
      await this.buildService.BuildAndPushDockerImage(event);
    } catch (error: unknown) {
      this.logger.error({
        message: "Error building and pushing Docker image",
        error,
      });
    }
  }
}
