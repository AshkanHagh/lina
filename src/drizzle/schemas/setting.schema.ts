import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../utils";

export const SettingTable = pgTable("settings", (table) => {
  return {
    id,
    key: table.varchar({ length: 255 }).notNull(),
    value: table.text(),
    createdAt,
    updatedAt,
  };
});

export type SettingRecord = typeof SettingTable.$inferSelect;
