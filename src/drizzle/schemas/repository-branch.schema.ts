import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { RepositoryTable } from "./repository.schema";
import { relations } from "drizzle-orm";

export const RepositoryBranchTable = pgTable("repository_branches", (table) => {
  return {
    id,
    repositoryId: table
      .uuid()
      .notNull()
      .references(() => RepositoryTable.id, { onDelete: "cascade" }),
    name: table.varchar({ length: 255 }).notNull(),
    isDefault: table.boolean().notNull(),
    createdAt,
    updatedAt,
  };
});

export type IRepositoryBranch = typeof RepositoryBranchTable.$inferSelect;

export const RepositoryBranchRelations = relations(
  RepositoryBranchTable,
  ({ one }) => ({
    repository: one(RepositoryTable, {
      fields: [RepositoryBranchTable.repositoryId],
      references: [RepositoryTable.id],
    }),
  }),
);
