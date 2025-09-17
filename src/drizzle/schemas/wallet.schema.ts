import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { UserTable } from "./user.schema";
import { relations } from "drizzle-orm";

export const WalletTable = pgTable("wallets", (table) => {
  return {
    id,
    userId: table
      .uuid()
      .notNull()
      .references(() => UserTable.id),
    tokens: table.bigint({ mode: "number" }).notNull(),
    createdAt,
    updatedAt,
  };
});

export const WalletRelations = relations(WalletTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [WalletTable.userId],
    references: [UserTable.id],
  }),
}));
