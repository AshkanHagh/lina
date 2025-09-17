import { createZodDto } from "nestjs-zod";
import z from "zod";

const RegisterSchema = z.object({
  email: z.email().max(255),
  password: z
    .string()
    // must be 8-255 characters, containing at least one number and one special character
    // and only include letters, digits, and allowed symbols
    .regex(/^(?=.{8,255}$)(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
export type RegisterPayload = z.infer<typeof RegisterSchema>;
