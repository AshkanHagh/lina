import { pgEnum, timestamp, uuid } from "drizzle-orm/pg-core";
import { PROVIDERS } from "../constants";

export const id = uuid().primaryKey().defaultRandom();
export const createdAt = timestamp().notNull().defaultNow();
export const updatedAt = timestamp()
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

export const providerEnum = pgEnum("provider_enum", PROVIDERS);
