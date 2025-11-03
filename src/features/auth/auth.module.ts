import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthUtilService } from "./util.service";
import { DrizzleModule } from "src/drizzle/drizzle.module";

@Module({
  imports: [DrizzleModule],
  controllers: [AuthController],
  providers: [AuthService, AuthUtilService],
})
export class AuthModule {}
