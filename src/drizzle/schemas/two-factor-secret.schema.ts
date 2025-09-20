import { pgTable } from "drizzle-orm/pg-core";
import { UserTable } from "./user.schema";
import { createdAt, updatedAt } from "./helpers";
import { relations } from "drizzle-orm";

export const TwoFactorSecretTable = pgTable("two_factor_secrets", (table) => {
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

export const TwoFactorSecretRelations = relations(
  TwoFactorSecretTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [TwoFactorSecretTable.userId],
      references: [UserTable.id],
    }),
  }),
);
