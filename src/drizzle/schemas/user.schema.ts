import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { ACCOUNT_TYPE } from "../constants";
import { relations } from "drizzle-orm";
import { OAuthAccountTable } from "./oauth-account.schema";
import { UserTwoFaTable } from "./user-two-fa.schema";

export const accountTypeEnum = pgEnum("account_type_enum", ACCOUNT_TYPE);

export const UserTable = pgTable("users", (table) => {
  return {
    id,
    fullname: table.varchar({ length: 255 }),
    email: table.varchar({ length: 255 }).notNull().unique(),
    phone: table.varchar({ length: 12 }),
    passwordHash: table.text(),
    avatar: table.text(),
    nationalCode: table.varchar({ length: 11 }),
    emailVerifiedAt: table.timestamp(),
    phoneVerifiedAt: table.timestamp(),
    accountType: accountTypeEnum().notNull(),
    isVerified: table.boolean().notNull(),
    twoFactor: table.boolean().notNull().default(false),
    createdAt,
    updatedAt,
  };
});

export const UserRelations = relations(UserTable, ({ one, many }) => ({
  oauthAccount: many(OAuthAccountTable),
  twoFa: one(UserTwoFaTable),
}));

export type IUser = typeof UserTable.$inferSelect;
export type IUserInsertForm = typeof UserTable.$inferInsert;
