import { Module } from "@nestjs/common";
import { BuildService } from "./build.service";
import { BuildUtilService } from "./util.service";
import { DockerBuildService } from "./services/docker-build.service";
import { DrizzleModule } from "src/drizzle/drizzle.module";
import { GithubModule } from "../github/github.module";

@Module({
  imports: [DrizzleModule, GithubModule],
  providers: [BuildService, BuildUtilService, DockerBuildService],
  exports: [BuildService, DockerBuildService],
})
export class BuildModule {}
