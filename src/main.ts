import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(<CorsOptions>{ origin: process.env.ORIGIN || "*" });
  app.setGlobalPrefix("/api/v1");
  // eslint-disable-next-line
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
