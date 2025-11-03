import { Module } from "@nestjs/common";
import { GithubService } from "./github.service";
import { GithubController } from "./github.controller";
import { DrizzleModule } from "src/drizzle/drizzle.module";
import { WebhookService } from "./webhook/webhook.service";
import { WebhookController } from "./webhook/webhook.controller";
import { WebhookUtilService } from "./webhook/util.service";

@Module({
  imports: [DrizzleModule],
  controllers: [GithubController, WebhookController],
  providers: [GithubService, WebhookService, WebhookUtilService],
})
export class GithubModule {}
