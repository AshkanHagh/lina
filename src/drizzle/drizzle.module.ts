import { Module } from "@nestjs/common";
import { DATABASE } from "./constants";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import { IDbConfig } from "src/configs/db.config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schemas";

@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig: IDbConfig | undefined = configService.get("db");
        const pool = new Pool({
          connectionString: dbConfig?.postgres.url,
        });

        return drizzle(pool, { casing: "snake_case", schema });
      },
    },
  ],
  exports: [DATABASE],
})
export class DrizzleModule {}
