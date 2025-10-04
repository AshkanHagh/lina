import { Module } from "@nestjs/common";
import { GithubService } from "./github.service";
import { GithubController } from "./github.controller";
import { DrizzleModule } from "src/drizzle/drizzle.module";
import { GithubAppService } from "./util-services/github-app.service";
import { WebhooksController } from "./webhooks/webhooks.controller";
import { WebhooksService } from "./webhooks/webhooks.service";
import { GithubScheduler } from "./scheduler";

@Module({
  imports: [DrizzleModule],
  controllers: [GithubController, WebhooksController],
  providers: [
    GithubService,
    GithubAppService,
    WebhooksService,
    GithubScheduler,
  ],
})
export class GithubModule {}
