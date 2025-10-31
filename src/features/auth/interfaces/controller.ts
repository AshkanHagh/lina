import { Response } from "express";
import { LoginDto, RegisterDto } from "../dtos";
import { User } from "src/drizzle/schemas";

export interface IAuthController {
  register(res: Response, payload: RegisterDto): Promise<User>;
  login(res: Response, payload: LoginDto): Promise<User>;
}
