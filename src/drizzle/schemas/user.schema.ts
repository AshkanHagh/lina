import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../utils";
import { relations } from "drizzle-orm";
import { IntegrationTable } from "./integration.schema";
import { RedirectStateTable } from "./redirect-state.schema";

export const UserTable = pgTable("users", (table) => {
  return {
    id,
    fullName: table.varchar({ length: 255 }).notNull(),
    email: table.varchar({ length: 255 }).notNull(),
    passwordHash: table.text().notNull(),
    twoFactorSecret: table.text(),
    twoFactorRecoveryCodes: table.text().array(),
    twoFactorConfirmedAt: table.timestamp(),
    createdAt,
    updatedAt,
  };
});

export type UserRecord = typeof UserTable.$inferSelect;
export type User = Omit<
  UserRecord,
  "passwordHash" | "updatedAt" | "twoFactorRecoveryCodes" | "twoFactorSecret"
>;
export type UserInsertForm = typeof UserTable.$inferInsert;

export const UserRelations = relations(UserTable, ({ many }) => ({
  integrations: many(IntegrationTable),
  redirectStates: many(RedirectStateTable),
}));
