import { Inject, Injectable } from "@nestjs/common";
import { IOAuthService } from "./interfaces/service";
import { GitOAuthService } from "./util-services/git-oauth.service";
import {
  OAuthAccountTable,
  OAuthStateTable,
  UserTable,
} from "src/drizzle/schemas";
import { ACCOUNT_TYPE, DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { eq, getTableColumns } from "drizzle-orm";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { OAuthCallbackPayload } from "./dto";
import { AuthUtilService } from "../util.service";
import { Response } from "express";
import { getElapsedTime } from "src/utils/elapsed-time";
import { OAUTH_STATE_EXP_MINUTES } from "./constants";
import { generateState } from "src/utils/state";

@Injectable()
export class OAuthService implements IOAuthService {
  constructor(
    @Inject(DATABASE) private db: Database,
    private gitOAuthService: GitOAuthService,
    private authUtilService: AuthUtilService,
  ) {}

  async initiateOAuth() {
    const state = generateState();
    const url = this.gitOAuthService.generateAuthUrl(
      ["user:read", "user:email"],
      state,
    );
    await this.db.insert(OAuthStateTable).values({ state }).execute();
    return url;
  }

  /*
    checks if the OAuth state exists and the authorization code is not expired in our database (
      we add an expiration tag to prevent users from spamming the database with temporary OAuth states
    ).
    gets user info using the provided OAuth code.
    creates a new user account if it doesn't exist, or adds a new OAuth account if the user already exists.
    updates user info each time they log in.
  */
  async oauthCallback(res: Response, payload: OAuthCallbackPayload) {
    const [state] = await this.db
      .select()
      .from(OAuthStateTable)
      .where(eq(OAuthStateTable.state, payload.state));
    if (!state) {
      throw new LinaError(LinaErrorType.NOT_FOUND, "STATE_NOT_FOUND");
    }

    if (getElapsedTime(state.createdAt, "minutes") > OAUTH_STATE_EXP_MINUTES) {
      throw new LinaError(LinaErrorType.OAUTH_STATE_EXPIRED);
    }

    const oauthUser = await this.gitOAuthService.signin(payload.code);

    return await this.db.transaction(async (tx) => {
      await tx
        .delete(OAuthStateTable)
        .where(eq(OAuthStateTable.state, payload.state))
        .execute();

      // eslint-disable-next-line
      const { passwordHash, ...userColumns } = getTableColumns(UserTable);
      const [userOAuthAccount] = await tx
        .select({
          user: userColumns,
          oauthAccount: OAuthAccountTable,
        })
        .from(UserTable)
        .leftJoin(OAuthAccountTable, eq(UserTable.id, OAuthAccountTable.userId))
        .where(eq(UserTable.email, oauthUser.email));

      let user = userOAuthAccount?.user;
      if (!user) {
        user = await this.authUtilService.initiateUserAccount(tx, {
          accountType: ACCOUNT_TYPE.OAUTH,
          email: oauthUser.email,
          avatar: oauthUser.avatar_url,
          fullname: oauthUser.name || oauthUser.login,
          isVerified: false,
        });
      }

      if (!userOAuthAccount?.oauthAccount) {
        await tx
          .insert(OAuthAccountTable)
          .values({
            login: oauthUser.login,
            avatarUrl: oauthUser.avatar_url,
            userId: user.id,
            providerId: oauthUser.id,
          })
          .onConflictDoNothing()
          .execute();
      }

      await tx
        .update(UserTable)
        .set({
          avatar: oauthUser.avatar_url,
          fullname: oauthUser.name || oauthUser.login,
        })
        .where(eq(UserTable.id, user.id))
        .execute();

      this.authUtilService.generateAuthToken(res, user);
      return user;
    });
  }
}
