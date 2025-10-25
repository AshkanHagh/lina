import { AuthUser } from "src/features/auth/types";

declare global {
  // eslint-disable-next-line
  namespace Express {
    interface Request {
      user?: AuthUser;
      rawBody: string;
    }
  }
}
