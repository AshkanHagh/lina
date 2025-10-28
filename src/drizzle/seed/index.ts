import { Pool } from "pg";
import { SettingTable } from "../schemas";
import { Database } from "../types";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../schemas";

async function seedDefaultSettings(tx: Database) {
  await tx
    .insert(SettingTable)
    .values([
      {
        key: "APP_URL",
        value: "http://localhost:7319",
      },
    ])
    .execute();
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { casing: "snake_case", schema });
  await db.transaction(async (tx) => {
    await seedDefaultSettings(tx);
  });

  process.exit(0);
}

main();
