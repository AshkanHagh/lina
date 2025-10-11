import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";
import { RepositoryTable } from "./repository.schema";
import { UserTable } from "./user.schema";
import { HostEnvTable } from "./host-env.schema";
import { relations } from "drizzle-orm";
import { EnvTable } from "./env.schema";
import { AUTO_DEPLOY_TRIGGER } from "../constants";
import { BuildTable } from "./build.schema";

export const HostStatesEnum = pgEnum("host_states", [
  "pending",
  "running",
  "paused",
  "stopped",
]);
export const HostAutoDeployTriggerEnum = pgEnum(
  "host_auto_deploy_trigger",
  AUTO_DEPLOY_TRIGGER,
);

// TODO: add build plan references
export const HostTable = pgTable("hosts", (table) => {
  return {
    id,
    repositoryId: table
      .uuid()
      .notNull()
      .references(() => RepositoryTable.id, { onDelete: "set null" }),
    userId: table
      .uuid()
      .notNull()
      .references(() => UserTable.id),
    envId: table
      .uuid()
      .notNull()
      .references(() => EnvTable.id),
    name: table.varchar({ length: 255 }).notNull(),
    slug: table.varchar({ length: 255 }).notNull(),
    includedPath: table.text().array(),
    ignoredPaths: table.text().array(),
    buildCommand: table.varchar({ length: 255 }),
    startCommand: table.varchar({ length: 255 }),
    autoDeploy: table.boolean().notNull(),
    dockerCommand: table.varchar({ length: 255 }),
    dockerfilePath: table.varchar({ length: 255 }),
    rootDir: table.varchar({ length: 255 }).notNull(),
    state: HostStatesEnum().notNull().default("pending"),
    healthCheckUrl: table.varchar({ length: 255 }),
    healthCheckHost: table.varchar({ length: 255 }),
    port: table.integer().notNull(),
    autoDeployTrigger: HostAutoDeployTriggerEnum()
      .notNull()
      .default(AUTO_DEPLOY_TRIGGER.PUSH),
    preDeployCommand: table.varchar({ length: 255 }),
    url: table.varchar({ length: 255 }),
    createdAt,
    updatedAt,
  };
});

export type IHost = typeof HostTable.$inferSelect;

export const HostRelations = relations(HostTable, ({ one, many }) => ({
  repository: one(RepositoryTable, {
    fields: [HostTable.repositoryId],
    references: [RepositoryTable.id],
  }),
  user: one(UserTable, {
    fields: [HostTable.userId],
    references: [UserTable.id],
  }),
  env: one(EnvTable, {
    fields: [HostTable.envId],
    references: [EnvTable.id],
  }),
  hostEnv: many(HostEnvTable),
  builds: many(BuildTable),
}));
