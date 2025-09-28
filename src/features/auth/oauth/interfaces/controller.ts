import { Response } from "express";
import { IUser } from "src/drizzle/schemas";
import { OAuthCallbackDto } from "../dto";

export interface IOAuthController {
  initiateOAuth(): Promise<{ url: string }>;
  oauthCallback(
    res: Response,
    payload: OAuthCallbackDto,
  ): Promise<Omit<IUser, "passwordHash">>;
}
