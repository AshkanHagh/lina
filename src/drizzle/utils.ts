import { timestamp, uuid } from "drizzle-orm/pg-core";

export const id = uuid().primaryKey().defaultRandom();
export const createdAt = timestamp().notNull().defaultNow();
export const updatedAt = timestamp()
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());
