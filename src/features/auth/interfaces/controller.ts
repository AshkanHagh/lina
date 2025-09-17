import { RegisterDto } from "../dto";

export interface IAuthController {
  register(payload: RegisterDto): Promise<{ token: string }>;
}
