import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id } from "./helpers";
import { relations } from "drizzle-orm";
import { OAuthAccountTable } from "./oauth-account.schema";

export const GithubAppStateTable = pgTable("github_app_states", (table) => {
  return {
    id,
    providerId: table
      .uuid()
      .notNull()
      .references(() => OAuthAccountTable.id),
    state: table.text().notNull(),
    createdAt,
  };
});

export const GithubAppStateRelations = relations(
  GithubAppStateTable,
  ({ one }) => ({
    oauthAccount: one(OAuthAccountTable, {
      fields: [GithubAppStateTable.providerId],
      references: [OAuthAccountTable.id],
    }),
  }),
);
