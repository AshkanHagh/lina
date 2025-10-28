import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import cookieParser from "cookie-parser";
import { raw } from "body-parser";
import { API_PREFIX } from "./constants/global.constant";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(`${API_PREFIX}/webhooks`, raw({ type: "application/json" }));

  app.enableCors(<CorsOptions>{ origin: process.env.ORIGIN || "*" });
  app.setGlobalPrefix(API_PREFIX);
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
