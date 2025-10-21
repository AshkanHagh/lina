import { createZodDto } from "nestjs-zod";
import z from "zod";

// must be 8-255 characters, containing at least one number and one special character
// and only include letters, digits, and allowed symbols
const passwordRegex =
  /^(?=.{8,255}$)(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

const RegisterSchema = z.object({
  fullname: z.string().max(255),
  email: z.email().max(255),
  password: z.string().regex(passwordRegex),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
export type RegisterPayload = z.infer<typeof RegisterSchema>;

const LoginSchema = z.object({
  email: z.email().max(255),
  password: z.string().regex(passwordRegex),
  code: z.string().length(6).optional(),
  backupCode: z.string().length(10).optional(),
});

export class LoginDto extends createZodDto(LoginSchema) {}
export type LoginPayload = z.infer<typeof LoginSchema>;

const VerifyTwoFactorSchema = z.object({
  secret: z.string().max(100),
  code: z.string().length(6),
});

export class VerifyTwoFactorDto extends createZodDto(VerifyTwoFactorSchema) {}
export type VerifyTwoFactorPayload = z.infer<typeof VerifyTwoFactorSchema>;
