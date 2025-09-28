import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { UserTable } from "./user.schema";
import { relations } from "drizzle-orm";

export const OAuthAccountTable = pgTable("oauth_accounts", (table) => {
  return {
    id,
    userId: table
      .uuid()
      .notNull()
      .references(() => UserTable.id),
    providerId: table.integer().notNull(),
    createdAt,
    updatedAt,
  };
});

export const OAuthAccountRelations = relations(
  OAuthAccountTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [OAuthAccountTable.userId],
      references: [UserTable.id],
    }),
  }),
);

export type IOAuthAccount = typeof OAuthAccountTable.$inferSelect;
export type IOAuthAccountInsertForm = typeof OAuthAccountTable.$inferInsert;
