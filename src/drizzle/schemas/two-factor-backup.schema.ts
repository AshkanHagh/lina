import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id } from "./helpers";
import { UserTable } from "./user.schema";
import { relations } from "drizzle-orm";

export const TwoFactorBackupTable = pgTable("two_factor_backups", (table) => {
  return {
    id,
    userId: table
      .uuid()
      .references(() => UserTable.id)
      .notNull(),
    code: table.varchar({ length: 10 }).notNull(),
    used: table.boolean().notNull(),
    createdAt,
  };
});

export const TwoFactorBackupRelations = relations(
  TwoFactorBackupTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [TwoFactorBackupTable.userId],
      references: [UserTable.id],
    }),
  }),
);

export type TwoFactorBackupInsertForm =
  typeof TwoFactorBackupTable.$inferInsert;
