import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { IUser } from "src/drizzle/schemas";

export const User = createParamDecorator(
  (
    user: keyof Omit<IUser, "passwordHash"> | undefined,
    ctx: ExecutionContext,
  ) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!user) {
      return req.user;
    }
    return req.user && req.user[user];
  },
);
