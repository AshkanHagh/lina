import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { relations } from "drizzle-orm";
import { TwoFactorBackupTable } from "./two-factor-backup.schema";

export const UserTable = pgTable("users", (table) => {
  return {
    id,
    fullname: table.varchar({ length: 255 }),
    email: table.varchar({ length: 255 }).notNull().unique(),
    passwordHash: table.text().notNull(),
    passwordRetryCount: table.smallint().notNull().default(0),
    twoFactor: table.boolean().notNull().default(false),
    twoFactorSecret: table.text(),
    createdAt,
    updatedAt,
  };
});

export const UserRelations = relations(UserTable, ({ many }) => ({
  twoFactorBackupCodes: many(TwoFactorBackupTable),
}));

export type IUser = typeof UserTable.$inferSelect;
export type ISanitizedUser = Omit<
  IUser,
  "passwordHash" | "twoFactorSecret" | "updatedAt" | "passwordRetryCount"
>;
export type IUserInsertForm = typeof UserTable.$inferInsert;
