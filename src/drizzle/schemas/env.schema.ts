import { pgTable } from "drizzle-orm/pg-core";
import { id } from "./helpers";
import { relations } from "drizzle-orm";
import { HostTable } from "./host.schema";

export const EnvTable = pgTable("envs", (table) => {
  return {
    id,
    name: table.varchar({ length: 50 }).notNull(),
    slug: table.varchar({ length: 50 }).notNull(),
    language: table.varchar({ length: 50 }).notNull(),
    sampleBuildCommand: table.varchar({ length: 255 }).notNull(),
    sampleStartCommand: table.varchar({ length: 255 }).notNull(),
  };
});

export type IEnv = typeof EnvTable.$inferSelect;

export const EnvRelations = relations(EnvTable, ({ many }) => ({
  hosts: many(HostTable),
}));
