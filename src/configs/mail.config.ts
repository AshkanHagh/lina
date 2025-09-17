import { Inject } from "@nestjs/common";
import { ConfigType, registerAs } from "@nestjs/config";

export const mailConfig = registerAs("mail", () => {
  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT!),
    secure: process.env.SMTP_TLS_ENABLED === "true",
    sender: process.env.SMTP_SEND_EMAIL,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };
});

export const MailConfig = () => Inject(mailConfig.KEY);
export type IMailConfig = ConfigType<typeof mailConfig>;
