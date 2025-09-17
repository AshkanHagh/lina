import { Module } from "@nestjs/common";
import { EmailWorker } from "./workers/email.worker";
import { EmailModule } from "src/features/email/email.module";

@Module({
  imports: [EmailModule],
  providers: [EmailWorker],
})
export class WorkerModule {}
