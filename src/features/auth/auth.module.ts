import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { DrizzleModule } from "src/drizzle/drizzle.module";
import { RepositoryModule } from "src/repository/repository.module";
import { AuthUtilService } from "./util.service";

@Module({
  imports: [DrizzleModule, RepositoryModule],
  controllers: [AuthController],
  providers: [AuthService, AuthUtilService],
})
export class AuthModule {}
