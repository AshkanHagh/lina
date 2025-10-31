import { Response } from "express";
import { RegisterDto } from "../dtos";
import { User } from "src/drizzle/schemas";

export interface IAuthController {
  register(res: Response, payload: RegisterDto): Promise<User>;
}
