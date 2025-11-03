import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../utils";
import { UserTable } from "./user.schema";
import { relations } from "drizzle-orm";

export const IntegrationTable = pgTable("integrations", (table) => {
  return {
    id,
    userId: table
      .uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    type: table.varchar({ length: 255 }).notNull(),
    name: table.varchar({ length: 255 }),
    data: table.jsonb().notNull(),
    createdAt,
    updatedAt,
  };
});

export const IntegrationRelations = relations(IntegrationTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [IntegrationTable.userId],
    references: [UserTable.id],
  }),
}));
