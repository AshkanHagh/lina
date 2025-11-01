import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schemas";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { casing: "snake_case", schema });

  await db
    .insert(schema.SettingTable)
    .values([
      {
        key: "REGISTER_ENABLE",
        value: "true",
      },
    ])
    .execute();
}

main();
process.exit(0);
