import { RawBodyRequest } from "@nestjs/common";
import { Request } from "express";

export interface IWebhookController {
  handleGithubWebhook(
    req: RawBodyRequest<Request>,
    event: string,
    signature: string,
  ): Promise<void>;
}
