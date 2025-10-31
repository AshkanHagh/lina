import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../utils";

export const UserTable = pgTable("users", (table) => {
  return {
    id,
    fullName: table.varchar({ length: 255 }).notNull(),
    email: table.varchar({ length: 255 }).notNull(),
    passwordHash: table.text().notNull(),
    createdAt,
    updatedAt,
  };
});

export type UserRecord = typeof UserTable.$inferSelect;
export type User = Omit<UserRecord, "passwordHash" | "updatedAt">;
export type UserInsertForm = typeof UserTable.$inferInsert;
