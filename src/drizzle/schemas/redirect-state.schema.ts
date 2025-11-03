import { index, pgTable } from "drizzle-orm/pg-core";
import { id } from "../utils";
import { UserTable } from "./user.schema";
import { relations } from "drizzle-orm";

export const RedirectStateTable = pgTable(
  "redirect_states",
  (table) => {
    return {
      id,
      userId: table
        .uuid()
        .notNull()
        .references(() => UserTable.id, { onDelete: "cascade" }),
      flow: table.varchar({ length: 255 }).notNull(),
      token: table.text().notNull(),
      data: table.jsonb().$type<Record<string, unknown>>(),
      expiresAt: table.timestamp().notNull(),
    };
  },
  (table) => [
    index("idx_redirect_states_token").on(table.token),
    index("idx_redirect_states_expires_at").on(table.expiresAt),
  ],
);

export const RedirectStateRelations = relations(
  RedirectStateTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [RedirectStateTable.userId],
      references: [UserTable.id],
    }),
  }),
);
