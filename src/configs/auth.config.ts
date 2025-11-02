import { Inject } from "@nestjs/common";
import { ConfigType, registerAs } from "@nestjs/config";

export const authConfig = registerAs("auth", () => {
  return {
    authToken: {
      secret: process.env.AUTH_TOKEN_SECRET || "sh",
      exp: 60 * 60 * 24 * 15,
    },
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 15,
      secure: process.env.NODE_ENV === "production",
    },
    twoFactorEncryptionKey: process.env.TWO_FACTOR_ENCRYPTION_KEY!,
  };
});

export const AuthConfig = () => Inject(authConfig.KEY);
export type IAuthConfig = ConfigType<typeof authConfig>;
