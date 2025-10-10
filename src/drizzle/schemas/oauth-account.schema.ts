import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { UserTable } from "./user.schema";
import { relations } from "drizzle-orm";
import { RepositoryTable } from "./repository.schema";
import { GithubAppStateTable } from "./github-app-state.schema";

export const OAuthAccountTable = pgTable("oauth_accounts", (table) => {
  return {
    id,
    userId: table
      .uuid()
      .notNull()
      .references(() => UserTable.id),
    name: table.varchar({ length: 255 }).notNull(),
    providerId: table.integer().notNull(),
    installationId: table.integer(),
    createdAt,
    updatedAt,
  };
});

export const OAuthAccountRelations = relations(
  OAuthAccountTable,
  ({ one, many }) => ({
    user: one(UserTable, {
      fields: [OAuthAccountTable.userId],
      references: [UserTable.id],
    }),
    repositories: many(RepositoryTable),
    githubAppState: one(GithubAppStateTable),
  }),
);

export type IOAuthAccount = typeof OAuthAccountTable.$inferSelect;
export type IOAuthAccountInsertForm = typeof OAuthAccountTable.$inferInsert;
