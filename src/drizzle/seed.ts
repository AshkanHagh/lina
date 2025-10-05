import { EnvDatasets } from "src/datasets/env.dataset";
import { EnvTable } from "./schemas";
import { Database } from "./types";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schemas";

async function seedEnvDatasets(tx: Database) {
  await tx.insert(EnvTable).values(EnvDatasets).execute();
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(client, { schema, casing: "snake_case" });

  await db.transaction(async (tx) => {
    await seedEnvDatasets(tx);
  });
}

main();
