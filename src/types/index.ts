import { User } from "src/drizzle/schemas";

declare global {
  // eslint-disable-next-line
  namespace Express {
    interface Request {
      user?: User;
      rawBody: string;
    }
  }
}
