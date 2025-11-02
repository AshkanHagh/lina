import { createZodDto } from "nestjs-zod";
import z from "zod";

const SetupGithubAppSchema = z.object({
  name: z.string().min(2).max(100),
});

export class SetupGithubAppDto extends createZodDto(SetupGithubAppSchema) {}
export type SetupGithubAppPayload = z.infer<typeof SetupGithubAppSchema>;
