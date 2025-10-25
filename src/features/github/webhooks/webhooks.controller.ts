// import { Controller, Headers, Post, RawBodyRequest, Req } from "@nestjs/common";
// import { WebhooksService } from "./webhooks.service";
// import { Request } from "express";
// import { IWebhooksController } from "./interfaces/controller";

// @Controller("webhooks")
// export class WebhooksController implements IWebhooksController {
//   constructor(private webhooksService: WebhooksService) {}

//   @Post("/github")
//   async handleGithubWebhook(
//     @Req() req: RawBodyRequest<Request>,
//     @Headers("x-hub-signature-256") signature: string,
//     @Headers("x-github-event") event: string,
//   ) {
//     const buf = req.body as Buffer;
//     await this.webhooksService.verifyAndReceive(
//       event,
//       buf.toString("utf8"),
//       signature,
//     );
//   }
// }
