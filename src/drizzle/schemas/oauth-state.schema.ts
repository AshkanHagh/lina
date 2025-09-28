import { pgTable } from "drizzle-orm/pg-core";
import { createdAt } from "./helpers";

export const OAuthStateTable = pgTable("oauth_states", (table) => {
  return {
    state: table.varchar({ length: 255 }).primaryKey(),
    createdAt,
  };
});
