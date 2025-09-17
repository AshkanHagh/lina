import { VerificationEmail } from "../types";

export interface IEmailService {
  sendVerificationEmail(payload: VerificationEmail): Promise<void>;
}
