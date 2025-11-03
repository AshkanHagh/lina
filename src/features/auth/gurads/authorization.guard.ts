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
import { LinaError, LinaErrorType } from "src/filters/exception";
import jwt from "jsonwebtoken";
import { Reflector } from "@nestjs/core";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    @AuthConfig() private authConfig: IAuthConfig,
    @Inject(DATABASE) private db: Database,
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

    const authToken = req.cookies["auth_token"] as string | undefined;
    if (!authToken) {
      throw new LinaError(LinaErrorType.UNAUTHORIZATION);
    }

    let userId: string;
    try {
      const result = jwt.verify(authToken, this.authConfig.authToken.secret);
      userId = (result as { userId: string }).userId;
    } catch (error) {
      throw new LinaError(LinaErrorType.INVALID_TOKEN, error);
    }

    const user = await this.db.query.UserTable.findFirst({
      where: (table, funcs) => funcs.eq(table.id, userId),
      columns: {
        id: true,
        email: true,
      },
    });
    if (!user) {
      throw new LinaError(LinaErrorType.UNAUTHORIZATION);
    }

    req.user = user;
    return true;
  }
}
