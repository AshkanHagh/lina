import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { lt } from "drizzle-orm";
import { DATABASE } from "src/drizzle/constants";
import { GithubAppStateTable } from "src/drizzle/schemas";
import { Database } from "src/drizzle/types";

@Injectable()
export class GithubScheduler {
  private logger = new Logger(GithubScheduler.name);

  constructor(@Inject(DATABASE) private db: Database) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleGithubStateExpire() {
    this.logger.log("handle github state expire");

    const threshold = new Date(Date.now() - 1000 * 60 * 30);
    await this.db
      .delete(GithubAppStateTable)
      .where(lt(GithubAppStateTable.createdAt, threshold))
      .execute();
  }
}
