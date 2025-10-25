// import { pgEnum, pgTable } from "drizzle-orm/pg-core";
// import { createdAt, id, updatedAt } from "./helpers";
// import { HostTable } from "./host.schema";
// import { relations } from "drizzle-orm";

// export const BuildStatus = pgEnum("build_status", [
//   "COMPLETED",
//   "FAILED",
//   "PENDING",
//   "RUNNING",
// ]);

// export const BuildTable = pgTable("builds", (table) => {
//   return {
//     id,
//     hostId: table
//       .uuid()
//       .notNull()
//       .references(() => HostTable.id, { onDelete: "cascade" }),
//     imageName: table.varchar({ length: 255 }).notNull(),
//     imageTag: table.varchar({ length: 255 }).notNull(),
//     commitSha: table.varchar({ length: 8 }).notNull(),
//     status: BuildStatus().notNull().default("PENDING"),
//     startTime: table.timestamp().notNull().defaultNow(),
//     endTime: table.timestamp(),
//     error: table.text(),
//     createdAt,
//     updatedAt,
//   };
// });

// export type IBuildInsertForm = typeof BuildTable.$inferInsert;

// export const BuildRelations = relations(BuildTable, ({ one }) => ({
//   host: one(HostTable, {
//     fields: [BuildTable.hostId],
//     references: [HostTable.id],
//   }),
// }));
