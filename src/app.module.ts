import { Module } from "@nestjs/common";
import { ConfigsModule } from "./configs/configs.module";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { AuthModule } from "./features/auth/auth.module";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { LinaExceptionFilter } from "./filters/exception-filter";
import { ZodValidationPipe } from "./utils/zod-validation.pipe";
import { WorkerModule } from "./worker/worker.module";
import { GithubModule } from "./features/github/github.module";
import { ScheduleModule } from "@nestjs/schedule";
import { OrchestrationModule } from "./features/orchestration/orchestration.module";
import { BuildModule } from "./features/build/build.module";

@Module({
  imports: [
    ConfigsModule.register(),
    DrizzleModule,
    AuthModule,
    WorkerModule,
    GithubModule,
    ScheduleModule.forRoot(),
    OrchestrationModule,
    BuildModule,
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
