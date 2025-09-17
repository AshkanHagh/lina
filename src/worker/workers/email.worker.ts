import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EmailService } from "src/features/email/email.service";
import { EMAIL_EVENTS } from "../constants";
import { VerificationEmail } from "src/features/email/types";

@Injectable()
export class EmailWorker {
  private logger = new Logger(EmailWorker.name);

  constructor(private emailService: EmailService) {}

  @OnEvent(EMAIL_EVENTS.SEND_VERIFICATION_EMAIL)
  async handleVerificationEmail(event: VerificationEmail) {
    try {
      await this.emailService.sendVerificationEmail(event);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
