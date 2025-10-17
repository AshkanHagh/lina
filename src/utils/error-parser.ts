export function parseError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
