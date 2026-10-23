/**
 * Builds the one- or two-letter initials shown in an avatar.
 *
 * Uses the first letters of the first and last words, so a middle name or a
 * two-word surname is skipped.
 *
 * @param name - A display name, such as the officer's.
 * @returns Uppercase initials, or `O` (for "Officer") when the name is blank.
 *
 * @example
 * initialsOf("Juan Dela Cruz"); // "JC"
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0]?.[0] ?? "");
  return letters.toUpperCase() || "O";
}
