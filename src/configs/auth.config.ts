import { Inject } from "@nestjs/common";
import { ConfigType, registerAs } from "@nestjs/config";

export const authConfig = registerAs("auth", () => {
  return {
    verification: {
      secret: process.env.VERIFICATION_TOKEN_SECRET || "sh",
      exp: 60 * 15,
    },
    authToken: {
      secret: process.env.AUTH_TOKEN_SECRET || "sh",
      exp: 1000 * 60 * 60 * 24 * 7,
    },
    hashMasterKey: process.env.HASH_MASTER_KEY || "shh",
    passwordRetryLimit: parseInt(process.env.PASSWORD_RETRY_LIMIT || "5"),
  };
});

export const AuthConfig = () => Inject(authConfig.KEY);
export type IAuthConfig = ConfigType<typeof authConfig>;
