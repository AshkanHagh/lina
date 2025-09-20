import { Injectable, Logger } from "@nestjs/common";
import { IEmailService } from "./interfaces/service";
import { MailerService } from "@nestjs-modules/mailer";
import { VerificationEmail } from "./types";

@Injectable()
export class EmailService implements IEmailService {
  private logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {}

  async sendVerificationEmail(payload: VerificationEmail): Promise<void> {
    this.logger.log("Verification email context", {
      payload,
    });

    await this.mailerService.sendMail({
      to: payload.email,
      subject: "Verify Your Account",
      template: "base",
      context: {
        subject: "Verify Your Account",
        appName: "lina.com",
        partialBody: "verify-account",
        ...payload,
      },
    });
  }
}
