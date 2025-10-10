import { Module } from "@nestjs/common";
import { BuildService } from "./build.service";

@Module({
  providers: [BuildService],
  exports: [BuildService],
})
export class BuildModule {}
