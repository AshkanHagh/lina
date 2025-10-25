import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import cookieParser from "cookie-parser";
import { raw } from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use("/api/v1/webhooks", raw({ type: "application/json" }));

  app.enableCors(<CorsOptions>{ origin: process.env.ORIGIN || "*" });
  app.setGlobalPrefix("/api/v1");
  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
