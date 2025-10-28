import { Module } from "@nestjs/common";
import { GithubService } from "./github.service";
import { GithubController } from "./github.controller";
import { DrizzleModule } from "src/drizzle/drizzle.module";
import { GithubAppService } from "./util-services/github-app.service";

@Module({
  imports: [DrizzleModule],
  controllers: [GithubController],
  providers: [GithubService, GithubAppService],
  exports: [GithubAppService],
})
export class GithubModule {}
