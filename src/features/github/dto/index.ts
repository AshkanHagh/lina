import { createZodDto } from "nestjs-zod";
import z from "zod";

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
