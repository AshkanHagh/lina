import { IUser } from "src/drizzle/schemas";
import { OAuthCallbackPayload } from "../dto";
import { Response } from "express";

export interface IOAuthService {
  initiateOAuth(): Promise<string>;
  oauthCallback(
    res: Response,
    payload: OAuthCallbackPayload,
  ): Promise<Omit<IUser, "passwordHash">>;
}
