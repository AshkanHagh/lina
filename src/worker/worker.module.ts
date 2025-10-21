import { Module } from "@nestjs/common";
import { BuildModule } from "src/features/build/build.module";
import { BuildWorker } from "./workers/build.worker";

@Module({
  imports: [BuildModule],
  providers: [BuildWorker],
})
export class WorkerModule {}
