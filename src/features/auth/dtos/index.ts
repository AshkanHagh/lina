import { createZodDto } from "nestjs-zod";
import z from "zod";

const RegisterSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.email(),
  password: z.string().max(255),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
export type RegisterPayload = z.infer<typeof RegisterSchema>;

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().max(255),
  twoFactorCode: z.string().length(6).optional(),
  twoFactorBackupCode: z.string().optional(),
});

export class LoginDto extends createZodDto(LoginSchema) {}
export type LoginPayload = z.infer<typeof LoginSchema>;

const VerifyTwoFactorSchema = z.object({
  code: z.string().length(6),
});

export class VerifyTwoFactorDto extends createZodDto(VerifyTwoFactorSchema) {}
export type VerifyTwoFactorPayload = z.infer<typeof VerifyTwoFactorSchema>;
