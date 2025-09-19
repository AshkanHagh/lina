import { createZodDto } from "nestjs-zod";
import z from "zod";

// must be 8-255 characters, containing at least one number and one special character
// and only include letters, digits, and allowed symbols
const passwordRegex =
  /^(?=.{8,255}$)(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

const RegisterSchema = z.object({
  email: z.email().max(255),
  password: z.string().regex(passwordRegex),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
export type RegisterPayload = z.infer<typeof RegisterSchema>;

const ResendVerificationCode = z.object({
  email: z.email().max(255),
});

export class ResendVerificationCodeDto extends createZodDto(
  ResendVerificationCode,
) {}
export type ResendVerificationCodePayload = z.infer<
  typeof ResendVerificationCode
>;

const VerifyRegister = z.object({
  token: z.jwt().max(300),
  code: z.number().int().gte(100_000).lte(999_999),
});

export class VerifyRegisterDto extends createZodDto(VerifyRegister) {}
export type VerifyRegisterPayload = z.infer<typeof VerifyRegister>;

const LoginSchema = z.object({
  email: z.email().max(255),
  password: z.string().regex(passwordRegex),
  code: z.string().length(6).optional(),
});

export class LoginDto extends createZodDto(LoginSchema) {}
export type LoginPayload = z.infer<typeof LoginSchema>;
