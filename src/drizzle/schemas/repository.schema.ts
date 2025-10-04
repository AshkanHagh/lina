import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { OAuthAccountTable } from "./oauth-account.schema";
import { relations } from "drizzle-orm";

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
    defaultBranch: table.varchar({ length: 255 }).notNull(),
    createdAt,
    updatedAt,
  };
});

export const RepositoryRelations = relations(RepositoryTable, ({ one }) => ({
  owner: one(OAuthAccountTable, {
    fields: [RepositoryTable.ownerId],
    references: [OAuthAccountTable.id],
  }),
}));
