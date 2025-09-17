import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DATABASE } from "src/drizzle/constants";
import { UserTable } from "src/drizzle/schemas";
import { Database } from "src/drizzle/types";

@Injectable()
export class UserRepository {
  constructor(@Inject(DATABASE) private db: Database) {}

  async findByEmail<
    const T extends { [K in keyof typeof UserTable.$inferSelect]?: boolean },
  >(email: string, fields?: T) {
    return await this.db.query.UserTable.findFirst({
      where: eq(UserTable.email, email),
      columns: fields,
    });
  }
}
