import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";

export const SettingTable = pgTable("settings", (table) => {
  return {
    id,
    key: table.varchar({ length: 255 }).notNull(),
    value: table.text(),
    createdAt,
    updatedAt,
  };
});

export type Setting = typeof SettingTable.$inferSelect;
export type SettingInsertForm = typeof SettingTable.$inferInsert;
