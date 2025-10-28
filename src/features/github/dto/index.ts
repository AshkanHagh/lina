import { createZodDto } from "nestjs-zod";
import z from "zod";

const CreateGithubAppSchema = z.object({
  name: z.string().min(1).max(100),
});

export class CreateGithubAppDto extends createZodDto(CreateGithubAppSchema) {}
export type CreateGithubAppPayload = z.infer<typeof CreateGithubAppSchema>;

const RedirectToGithubSchema = z.object({
  state: z.string(),
  manifest: z.string(),
});

export class RedirectToGithubDto extends createZodDto(RedirectToGithubSchema) {}
export type RedirectToGithubPayload = z.infer<typeof RedirectToGithubSchema>;

const InstallationCallbackSchema = z.object({
  installation_id: z.coerce.number(),
  state: z.string(),
  setup_action: z.enum(["install", "update"]),
});

export class InstallationCallbackDto extends createZodDto(
  InstallationCallbackSchema,
) {}

export type InstallationCallbackPayload = z.infer<
  typeof InstallationCallbackSchema
>;
