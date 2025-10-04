import { Module } from "@nestjs/common";
import { ConfigsModule } from "./configs/configs.module";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { AuthModule } from "./features/auth/auth.module";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { LinaExceptionFilter } from "./filters/exception-filter";
import { ZodValidationPipe } from "./utils/zod-validation.pipe";
import { EmailModule } from "./features/email/email.module";
import { WorkerModule } from "./worker/worker.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { GithubModule } from "./features/github/github.module";

@Module({
  imports: [
    ConfigsModule.register(),
    DrizzleModule,
    AuthModule,
    EmailModule,
    WorkerModule,
    EventEmitterModule.forRoot(),
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
