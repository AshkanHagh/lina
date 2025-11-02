import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schemas";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { casing: "snake_case", schema });

  await db.transaction(async (tx) => {
    await tx.insert(schema.SettingTable).values([
      {
        key: "REGISTER_ENABLE",
        value: "true",
      },
      {
        key: "APP_URL",
        value: "http://localhost:7319",
      },
      {
        key: "GITHUB_WEBHOOK_URL",
        value: process.env.GITHUB_WEBHOOK_URL,
      },
    ]);
  });

  process.exit(0);
}

main();
