// import { Inject } from "@nestjs/common";
// import { DATABASE } from "src/drizzle/constants";
// import { Database } from "src/drizzle/types";
// import { BuildTable, IBuildInsertForm } from "src/drizzle/schemas";
// import { eq } from "drizzle-orm";

// export class BuildUtilService {
//   constructor(@Inject(DATABASE) private db: Database) {}

//   async updateBuildStatus(buildId: string, form: Partial<IBuildInsertForm>) {
//     await this.db
//       .update(BuildTable)
//       .set(form)
//       .where(eq(BuildTable.id, buildId))
//       .execute();
//   }
// }
