import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "src/drizzle/constants";
import {
  IPendingUser,
  IPendingUserInsertForm,
  PendingUserTable,
} from "src/drizzle/schemas";
import { Database } from "src/drizzle/types";

@Injectable()
export class PendingUserRepository {
  constructor(@Inject(DATABASE) private db: Database) {}

  async findByEmail<
    const T extends {
      [Key in keyof typeof PendingUserTable.$inferSelect]?: boolean;
    },
  >(email: string, fields?: T) {
    return await this.db.query.PendingUserTable.findFirst({
      columns: fields,
      where: (table, funcs) => funcs.eq(table.email, email),
    });
  }

  async insert(tx: Database, form: IPendingUserInsertForm) {
    const [result] = await tx.insert(PendingUserTable).values(form).returning();
    return result;
  }

  async update(tx: Database, form: Partial<IPendingUser>) {
    await tx.update(PendingUserTable).set(form).execute();
  }
}
