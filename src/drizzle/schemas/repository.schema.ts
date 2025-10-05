import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { OAuthAccountTable } from "./oauth-account.schema";
import { relations } from "drizzle-orm";
import { RepositoryBranchTable } from "./repository-branch.schema";

// TODO: update oauth account to store oauth user infos
// TODO: add new branches  table
// TODO: add new github integratin table
export const RepositoryTable = pgTable("repositories", (table) => {
  return {
    id,
    providerId: table.integer().notNull().unique(),
    ownerId: table
      .uuid()
      .notNull()
      .references(() => OAuthAccountTable.id),
    name: table.varchar({ length: 255 }).notNull(),
    fullName: table.varchar({ length: 255 }).notNull(),
    isPrivate: table.boolean().notNull(),
    isFork: table.boolean().notNull(),
    url: table.text().notNull(),
    createdAt,
    updatedAt,
  };
});

export const RepositoryRelations = relations(
  RepositoryTable,
  ({ one, many }) => ({
    owner: one(OAuthAccountTable, {
      fields: [RepositoryTable.ownerId],
      references: [OAuthAccountTable.id],
    }),
    branches: many(RepositoryBranchTable),
  }),
);
