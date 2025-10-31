import { createZodDto } from "nestjs-zod";
import z from "zod";

const RegisterSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.email(),
  password: z.string().max(255),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
export type RegisterPayload = z.infer<typeof RegisterSchema>;
