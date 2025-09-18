import { RegisterPayload, ResendVerificationCodePayload } from "../dto";

export interface IAuthService {
  register(payload: RegisterPayload): Promise<string>;
  resendVerificationCode(
    payload: ResendVerificationCodePayload,
  ): Promise<string>;
}
