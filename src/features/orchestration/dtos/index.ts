import { createZodDto } from "nestjs-zod";
import { AUTO_DEPLOY_TRIGGER } from "src/drizzle/constants";
import z from "zod";

const StartAppDeploymentSchema = z.object({
  envId: z.uuid(),
  branchId: z.uuid(),
  name: z.string().max(255),
  buildCommand: z.string().optional(),
  startCommand: z.string().optional(),
  dockerfilePath: z.string().optional(),
  rootDir: z.string(),
  healthCheckUrl: z.string().optional(),
  autoDeployTrigger: z.enum(AUTO_DEPLOY_TRIGGER).optional(),
  preDeployCommand: z.string().optional(),
  includedPath: z.array(z.string()).optional(),
  ignoredPaths: z.array(z.string()).optional(),
  hostEnv: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),
});

export class StartAppDeploymentDto extends createZodDto(
  StartAppDeploymentSchema,
) {}
export type StartAppDeployment = z.infer<typeof StartAppDeploymentSchema>;
