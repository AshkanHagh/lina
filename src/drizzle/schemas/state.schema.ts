import { pgTable } from "drizzle-orm/pg-core";

export const StateTable = pgTable("states", (table) => {
  return {
    state: table.text().primaryKey(),
    expiredAt: table.timestamp().notNull(),
  };
});

export type State = typeof StateTable.$inferSelect;
export type StateInsertForm = typeof StateTable.$inferInsert;
