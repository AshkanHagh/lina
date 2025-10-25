// import { pgEnum, pgTable } from "drizzle-orm/pg-core";
// import { id } from "./helpers";
// import { relations } from "drizzle-orm";
// import { HostTable } from "./host.schema";

// export const EnvNameEnum = pgEnum("env_name_enum", ["node", "docker"]);

// export const EnvTable = pgTable("envs", (table) => {
//   return {
//     id,
//     name: EnvNameEnum().notNull(),
//     slug: table.varchar({ length: 50 }).notNull(),
//     language: table.varchar({ length: 50 }).notNull(),
//     sampleBuildCommand: table.varchar({ length: 255 }).notNull(),
//     sampleStartCommand: table.varchar({ length: 255 }).notNull(),
//   };
// });

// export type IEnv = typeof EnvTable.$inferSelect;
// export type IEnvInsertForm = typeof EnvTable.$inferInsert;
// export type AppEnv = (typeof EnvNameEnum.enumValues)[number];

// export const EnvRelations = relations(EnvTable, ({ many }) => ({
//   hosts: many(HostTable),
// }));
