import { Module } from "@nestjs/common";
import { DrizzleModule } from "src/drizzle/drizzle.module";
import { UserRepository } from "./repositories/user.repository";
import { PendingUserRepository } from "./repositories/pending-user.repository";

const repositories = [UserRepository, PendingUserRepository];

@Module({
  imports: [DrizzleModule],
  providers: [...repositories],
  exports: [...repositories],
})
export class RepositoryModule {}
