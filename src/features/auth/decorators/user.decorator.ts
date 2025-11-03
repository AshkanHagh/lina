import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { AuthUser } from "src/types";

export const UserD = createParamDecorator(
  (fields: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();

    if (!fields) {
      return req.user;
    }
    return req.user && req.user[fields];
  },
);
