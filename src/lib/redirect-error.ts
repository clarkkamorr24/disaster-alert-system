/**
 * Checks whether a Server Action call was rejected because the action called
 * `redirect()`. On the client, such a call rejects with an error whose
 * `digest` starts with `NEXT_REDIRECT`; rethrow it so Next.js finishes the
 * navigation.
 *
 * @param error - Anything caught from awaiting a Server Action.
 * @returns `true` for a redirect, `false` for a real failure.
 */
export function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String(error.digest).startsWith("NEXT_REDIRECT")
  );
}
