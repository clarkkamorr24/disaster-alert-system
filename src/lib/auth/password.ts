import bcrypt from "bcryptjs";

/** bcrypt cost factor: 2^12 rounds, about a quarter second per hash. */
const BCRYPT_COST = 12;

/**
 * Hashes a password with bcrypt for storage in `Officer.passwordHash`.
 *
 * Each call uses a new random salt, so hashing the same password twice gives
 * two different hashes; compare with {@link verifyPassword}, never with `===`.
 *
 * @param password - The plain-text password.
 * @returns The bcrypt hash, salt and cost included.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Checks a plain-text password against a hash from {@link hashPassword}.
 *
 * @param password - The password as typed.
 * @param hash - The stored bcrypt hash.
 * @returns `true` when the password matches.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
