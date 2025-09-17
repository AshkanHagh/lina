import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, providerEnum } from "./helpers";

export const OAuthStateTable = pgTable("oauth_states", (table) => {
  return {
    id,
    provider: providerEnum().notNull(),
    state: table.varchar({ length: 255 }).notNull().unique(),
    codeVerifier: table.varchar({ length: 255 }),
    createdAt,
  };
});
