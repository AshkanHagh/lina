import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { HostTable } from "./host.schema";
import { relations } from "drizzle-orm";

export const HostEnvTable = pgTable("host_envs", (table) => {
  return {
    id,
    hostId: table
      .uuid()
      .notNull()
      .references(() => HostTable.id, { onDelete: "cascade" }),
    name: table.varchar({ length: 255 }).notNull(),
    value: table.text().notNull(),
    createdAt,
    updatedAt,
  };
});

export const HostEnvRelations = relations(HostEnvTable, ({ one }) => ({
  host: one(HostTable, {
    fields: [HostEnvTable.hostId],
    references: [HostTable.id],
  }),
}));
