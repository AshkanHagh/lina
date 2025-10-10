import { Module } from "@nestjs/common";
import { EmailWorker } from "./workers/email.worker";
import { EmailModule } from "src/features/email/email.module";
import { BuildModule } from "src/features/build/build.module";
import { BuildWorker } from "./workers/build.worker";

@Module({
  imports: [EmailModule, BuildModule],
  providers: [EmailWorker, BuildWorker],
})
export class WorkerModule {}
