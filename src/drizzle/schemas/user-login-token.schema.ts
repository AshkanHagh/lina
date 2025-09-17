import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id } from "./helpers";
import { UserTable } from "./user.schema";
import { relations } from "drizzle-orm";

export const UserLoginTokenTable = pgTable("user_login_tokens", (table) => {
  return {
    id,
    userId: table
      .uuid()
      .notNull()
      .references(() => UserTable.id),
    token: table.text().notNull(),
    userAgent: table.varchar({ length: 100 }).notNull(),
    ip: table.varchar({ length: 100 }).notNull(),
    createdAt: createdAt.$onUpdate(() => new Date()),
  };
});

export const UserLoginTokenRelations = relations(
  UserLoginTokenTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [UserLoginTokenTable.userId],
      references: [UserTable.id],
    }),
  }),
);

export type UserLoginToken = typeof UserLoginTokenTable.$inferSelect;
export type UserLoginTokenInsertForm = typeof UserLoginTokenTable.$inferInsert;
