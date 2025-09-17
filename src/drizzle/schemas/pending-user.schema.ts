import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id } from "./helpers";

export const PendingUserTable = pgTable("pending_users", (table) => {
  return {
    id,
    email: table.varchar({ length: 255 }).notNull(),
    passwordHash: table.text().notNull(),
    token: table.text().notNull(),
    createdAt,
  };
});
