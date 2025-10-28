import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";

export type GithubAppPermissions = {
  metadata: string;
  contents: string;
};

export const GithubAppTable = pgTable("github_apps", (table) => {
  return {
    id,
    appId: table.integer().notNull(),
    installationId: table.integer(),
    name: table.varchar({ length: 255 }).notNull(),
    organization: table.varchar({ length: 255 }),
    permissions: table.jsonb().$type<GithubAppPermissions>().notNull(),
    events: table.text().array().notNull(),
    clientId: table.text().notNull(),
    clientSecret: table.text().notNull(),
    webhookSecret: table.text().notNull(),
    pem: table.text().notNull(),
    createdAt,
    updatedAt,
  };
});
