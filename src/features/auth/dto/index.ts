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
