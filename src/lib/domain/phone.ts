/** Characters people use to group digits: spaces, dashes, dots, and parentheses. */
const SEPARATORS = /[\s\-.()]/g;

/** Result of {@link normalizePhilippineMobile}. */
export type PhoneNormalizeResult =
  | { ok: true; e164: string }
  | { ok: false; error: string };

/**
 * Converts a Philippine mobile number to the canonical `+639XXXXXXXXX` format.
 *
 * Spaces, dashes, dots, and parentheses are removed first. The remaining text
 * must be one of `09XXXXXXXXX`, `639XXXXXXXXX`, `+639XXXXXXXXX`, or a bare
 * `9XXXXXXXXX` (Excel drops the leading 0). Landlines, numbers of the wrong
 * length, and Excel scientific notation such as `9.17E+09` are rejected.
 *
 * @param input - The number as typed or imported.
 * @returns `{ ok: true, e164 }` on success, or `{ ok: false, error }` with a reason.
 *
 * @example
 * normalizePhilippineMobile("0917 123 4567"); // { ok: true, e164: "+639171234567" }
 */
export function normalizePhilippineMobile(input: string): PhoneNormalizeResult {
  const compact = input.replace(SEPARATORS, "");
  if (compact === "") {
    return { ok: false, error: "Mobile number is empty." };
  }

  const match = /^(?:\+?63|0)?(9\d{9})$/.exec(compact);
  if (!match) {
    return {
      ok: false,
      error: "Enter a Philippine mobile number, like 0917 123 4567.",
    };
  }

  return { ok: true, e164: `+63${match[1]}` };
}

/**
 * Formats a canonical `+639XXXXXXXXX` number the way Filipinos write it.
 *
 * @param e164 - A number already normalized by {@link normalizePhilippineMobile}.
 * @returns The local format `0917 123 4567`, or the input unchanged if it is not canonical.
 *
 * @example
 * formatPhoneForDisplay("+639171234567"); // "0917 123 4567"
 */
export function formatPhoneForDisplay(e164: string): string {
  const match = /^\+63(9\d{2})(\d{3})(\d{4})$/.exec(e164);
  if (!match) return e164;
  return `0${match[1]} ${match[2]} ${match[3]}`;
}
