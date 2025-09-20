import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { AuthConfig, IAuthConfig } from "src/configs/auth.config";
import { DATABASE } from "src/drizzle/constants";
import { Database } from "src/drizzle/types";
import { AUTH_TOKEN_COOKIE_NAME } from "../constants";
import { LinaError, LinaErrorType } from "src/filters/exception";
import { verify } from "jsonwebtoken";
import { Reflector } from "@nestjs/core";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    @Inject(DATABASE) private db: Database,
    @AuthConfig() private authConfig: IAuthConfig,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipAuth = this.reflector.get<boolean>(
      "skip-auth",
      context.getHandler(),
    );
    if (skipAuth) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();

    // eslint-disable-next-line
    const token = req.cookies[AUTH_TOKEN_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw new LinaError(LinaErrorType.UNAUTHORIZED);
    }

    let tokenPayload: { userId: string };
    try {
      tokenPayload = verify(token, this.authConfig.authToken.secret) as {
        userId: string;
      };
    } catch (error) {
      throw new LinaError(LinaErrorType.INVALID_TOKEN, error);
    }

    const user = await this.db.query.UserTable.findFirst({
      where: (table, funcs) => funcs.eq(table.id, tokenPayload.userId),
      columns: {
        passwordHash: false,
      },
    });
    if (!user) {
      throw new LinaError(LinaErrorType.UNAUTHORIZED);
    }
    req.user = user;

    return true;
  }
}
