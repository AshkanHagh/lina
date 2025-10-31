import { User } from "src/drizzle/schemas";
import { RegisterPayload } from "../dtos";
import { Response } from "express";

export interface IAuthService {
  register(res: Response, payload: RegisterPayload): Promise<User>;
}
