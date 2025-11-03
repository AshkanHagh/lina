import { Controller, Headers, Post, RawBodyRequest, Req } from "@nestjs/common";
import { IWebhookController } from "./interfaces/controller";
import { WebhookService } from "./webhook.service";
import { Request } from "express";

@Controller("webhooks")
export class WebhookController implements IWebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post("/github")
  async handleGithubWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-github-event") event: string,
    @Headers("x-hub-signature-256") signature: string,
  ): Promise<void> {
    await this.webhookService.verifyAndReceive(
      req.rawBody.toString("utf-8"),
      event,
      signature,
    );
  }
}
