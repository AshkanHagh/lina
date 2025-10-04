import { randomBytes } from "node:crypto";

export function generateState() {
  return randomBytes(32).toString("hex");
}
