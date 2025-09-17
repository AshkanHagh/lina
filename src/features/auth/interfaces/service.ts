import { RegisterPayload } from "../dto";

export interface IAuthService {
  register(payload: RegisterPayload): Promise<string>;
}
