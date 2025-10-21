import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { dbConfig } from "./db.config";
import { authConfig } from "./auth.config";
import { githubConfig } from "./github.config";
import { dockerConfig } from "./docker.config";

@Module({})
export class ConfigsModule {
  static register(): Promise<DynamicModule> {
    return ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [dbConfig, authConfig, githubConfig, dockerConfig],
    });
  }
}
