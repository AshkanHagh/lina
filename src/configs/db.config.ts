import { Inject } from "@nestjs/common";
import { ConfigType, registerAs } from "@nestjs/config";

export const dbConfig = registerAs("db", () => {
  return {
    postgres: {
      url: process.env.DATABASE_URL,
    },
  };
});

export const DbConfig = Inject(dbConfig.KEY);
export type IDbConfig = ConfigType<typeof dbConfig>;
