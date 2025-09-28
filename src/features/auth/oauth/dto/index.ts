import { createZodDto } from "nestjs-zod";
import z from "zod";

const OAuthCallbackSchema = z.object({
  code: z.string().min(1).max(1000),
  state: z.string(),
});

export class OAuthCallbackDto extends createZodDto(OAuthCallbackSchema) {}
export type OAuthCallbackPayload = z.infer<typeof OAuthCallbackSchema>;
