import type { DbOfficer, SessionOfficer } from "@/types/auth";
import { verifyPassword } from "./password";

/** Data access needed by {@link verifyCredentials}, injected so tests need no database. */
export interface CredentialsDeps {
  /** Finds the officer by email, already trimmed and lowercased. */
  findOfficerByEmail(email: string): Promise<DbOfficer | null>;
}

/**
 * Checks an email and password against the officer account.
 *
 * The email is trimmed and lowercased before the lookup, matching how the
 * seed script stores it. An unknown email and a wrong password both return
 * `null`, so callers cannot tell which one failed.
 *
 * @param email - The email as typed.
 * @param password - The password as typed.
 * @param deps - Where to look up the officer.
 * @returns The officer's session fields, or `null` when the credentials are wrong.
 */
export async function verifyCredentials(
  email: string,
  password: string,
  deps: CredentialsDeps,
): Promise<SessionOfficer | null> {
  const officer = await deps.findOfficerByEmail(email.trim().toLowerCase());
  if (!officer) return null;
  if (!(await verifyPassword(password, officer.passwordHash))) return null;

  return {
    id: officer.id,
    name: officer.name,
    email: officer.email,
    sessionVersion: officer.sessionVersion,
  };
}
