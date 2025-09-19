import { pgTable } from "drizzle-orm/pg-core";
import { UserTable } from "./user.schema";
import { createdAt, updatedAt } from "./helpers";
import { relations } from "drizzle-orm";

export const UserTwoFaTable = pgTable("user_two_fa", (table) => {
  return {
    userId: table
      .uuid()
      .primaryKey()
      .references(() => UserTable.id),
    secret: table.text().notNull(),
    createdAt,
    updatedAt,
  };
});

export const UserTwoFaRelations = relations(UserTwoFaTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [UserTwoFaTable.userId],
    references: [UserTable.id],
  }),
}));
