import { RawBodyRequest } from "@nestjs/common";
import { Request } from "express";

export interface IWebhooksController {
  handleGithubWebhook(
    payload: RawBodyRequest<Request>,
    signature: string,
    event: string,
  ): Promise<void>;
}
