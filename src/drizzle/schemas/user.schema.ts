import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { relations } from "drizzle-orm";
import { TwoFactorSecretTable } from "./two-factor-secret.schema";
import { TwoFactorBackupTable } from "./two-factor-backup.schema";
import { HostTable } from "./host.schema";

export const UserTable = pgTable("users", (table) => {
  return {
    id,
    fullname: table.varchar({ length: 255 }),
    email: table.varchar({ length: 255 }).notNull().unique(),
    passwordHash: table.text().notNull(),
    twoFactor: table.boolean().notNull().default(false),
    passwordRetryCount: table.smallint().notNull().default(0),
    createdAt,
    updatedAt,
  };
});

export const UserRelations = relations(UserTable, ({ one, many }) => ({
  twoFactorSecret: one(TwoFactorSecretTable),
  twoFactorBackupCodes: many(TwoFactorBackupTable),
  hosts: many(HostTable),
}));

export type IUser = typeof UserTable.$inferSelect;
export type IUserInsertForm = typeof UserTable.$inferInsert;
