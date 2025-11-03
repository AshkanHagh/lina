import { createZodDto } from "nestjs-zod";
import z from "zod";

const SetupGithubAppSchema = z.object({
  name: z.string().min(2).max(100),
  org: z.string().min(2).max(100).optional(),
});

export class SetupGithubAppDto extends createZodDto(SetupGithubAppSchema) {}
export type SetupGithubAppPayload = z.infer<typeof SetupGithubAppSchema>;

const GithubAppCallbackSchema = z.object({
  code: z.string().max(255),
  state: z.string().max(255),
});

export class GithubAppCallbackDto extends createZodDto(
  GithubAppCallbackSchema,
) {}
export type GithubAppCallbackPayload = z.infer<typeof GithubAppCallbackSchema>;

const InstallCallbackSchema = z.object({
  installation_id: z.coerce.number(),
  setup_action: z.enum(["install", "update"]),
  state: z.string().max(255),
});

export class InstallCallbackDto extends createZodDto(InstallCallbackSchema) {}
export type InstallCallbackPayload = z.infer<typeof InstallCallbackSchema>;
