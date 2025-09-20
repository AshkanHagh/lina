import { MailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { join } from "node:path";
import { IMailConfig } from "src/configs/mail.config";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { EmailService } from "./email.service";

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mailConfig = configService.getOrThrow<IMailConfig>("mail");
        const templatesPath = join(process.cwd(), "dist", "templates", "pages");
        const partialsPath = join(
          process.cwd(),
          "dist",
          "templates",
          "partials",
        );

        const isProduction = process.env.NODE_ENV === "production";

        return {
          transport: {
            host: isProduction ? mailConfig.host : "127.0.0.1",
            port: mailConfig.port,
            secure: mailConfig.secure,
            auth: isProduction ? mailConfig.auth : undefined,
          },
          defaults: {
            from: mailConfig.sender,
          },
          template: {
            dir: templatesPath,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
          options: {
            partials: {
              dir: partialsPath,
              options: {
                strict: true,
              },
            },
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
