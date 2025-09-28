import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { AuthorizationCode } from "simple-oauth2";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { LinaError, LinaErrorType } from "src/filters/exception";
import ky from "ky";
import { GithubUserEmailResponse, GithubUserResponse } from "../types";

export interface GithubUser {
  id: number;
  email: string;
  login: string;
  name: string;
  avatar_url: string;
}

@Injectable()
export class GitOAuthService {
  private client: AuthorizationCode;

  constructor(@AuthConfig() private authConfig: IAuthConfig) {
    this.client = new AuthorizationCode({
      auth: {
        authorizeHost: "https://github.com",
        tokenHost: "https://github.com",
        authorizePath: "/login/oauth/authorize",
        tokenPath: "/login/oauth/access_token",
      },
      client: {
        id: this.authConfig.oauth.id!,
        secret: this.authConfig.oauth.secret!,
      },
    });
  }

  generateAuthUrl(scope: string[], state: string) {
    return this.client.authorizeURL({
      redirect_uri: this.authConfig.oauth.redirectUri,
      scope,
      state,
    });
  }

  async #getUserDetail(accessToken: string): Promise<GithubUser> {
    try {
      const [user, emails] = await Promise.all([
        ky
          .get("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "User-agent": "lina",
            },
          })
          .json<GithubUserResponse>(),
        ky
          .get("https://api.github.com/user/emails", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "User-agent": "lina",
            },
          })
          .json<GithubUserEmailResponse[]>(),
      ]);

      const primaryEmail = emails.find(
        (email) => email.verified && email.primary,
      );
      if (!primaryEmail) {
        throw new LinaError(
          LinaErrorType.OAUTH_USER_FAILED,
          "NO_PRIMARY_EMAIL",
        );
      }

      return {
        avatar_url: user.avatar_url,
        email: primaryEmail.email,
        id: user.id,
        login: user.login,
        name: user.name,
      };
    } catch (error) {
      throw new LinaError(LinaErrorType.OAUTH_USER_FAILED, error);
    }
  }

  async signin(code: string) {
    try {
      const { token } = await this.client.getToken({
        code,
        redirect_uri: this.authConfig.oauth.redirectUri!,
      });
      const accessToken = token.access_token as string;

      return this.#getUserDetail(accessToken);
    } catch (error) {
      throw new LinaError(LinaErrorType.OAUTH_FAILED, error);
    }
  }

  generateState() {
    return randomBytes(32).toString("hex");
  }
}
