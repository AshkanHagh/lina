import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./helpers";

export const ServerTable = pgTable("servers", (table) => {
  return {
    id,
    name: table.varchar({ length: 255 }).notNull(),
    description: table.text(),
    isActive: table.boolean().notNull().default(true),
    publicIpv4: table.varchar({ length: 45 }),
    publicIpv6: table.varchar({ length: 45 }),
    sshPort: table.integer().notNull().default(22),
    sshUser: table.varchar({ length: 255 }).notNull().default("root"),
    sshKey: table.text(),
    webPort: table.integer().notNull().default(80),
    createdAt,
    updatedAt,
  };
});
