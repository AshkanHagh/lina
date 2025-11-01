import { User } from "src/drizzle/schemas";

export type AuthUser = Pick<User, "email" | "id">;

declare global {
  // eslint-disable-next-line
  namespace Express {
    interface Request {
      user?: AuthUser;
      rawBody: string;
    }
  }
}
