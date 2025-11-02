import { Module } from "@nestjs/common";
import { ConfigsModule } from "./configs/configs.module";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { LinaExceptionFilter } from "./filters/exception-filter";
import { ZodValidationPipe } from "./utils/zod-validation.pipe";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./features/auth/auth.module";
import { GithubModule } from "./features/github/github.module";

@Module({
  imports: [
    ConfigsModule.register(),
    ScheduleModule.forRoot(),
    DrizzleModule,
    AuthModule,
    GithubModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: LinaExceptionFilter,
    },
    {
      provide: APP_PIPE,
      // @ts-expect-error unknown type
      // because new version nestjs-zod wont return the type
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
