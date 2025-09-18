import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id } from "./helpers";

export const PendingUserTable = pgTable("pending_users", (table) => {
  return {
    id,
    email: table.varchar({ length: 255 }).unique().notNull(),
    passwordHash: table.text().notNull(),
    createdAt,
  };
});

export type IPendingUser = typeof PendingUserTable.$inferSelect;
export type IPendingUserInsertForm = typeof PendingUserTable.$inferInsert;
