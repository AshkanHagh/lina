import "dotenv/config";
import { EnvDatasets } from "src/datasets/env.dataset";
import { EnvTable } from "../schemas";
import { Database } from "../types";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../schemas";

async function seedEnvDatasets(tx: Database) {
  await tx.insert(EnvTable).values(EnvDatasets).execute();
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client, { schema, casing: "snake_case" });

  await db.transaction(async (tx) => {
    await seedEnvDatasets(tx);
  });

  console.log("Seed completed successfully");
  await client.end();
  process.exit(0);
}

main();
