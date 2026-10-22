/** Longest message UniSMS accepts, in characters. */
export const SMS_MAX_CHARS = 670;

/** Characters billed as one credit, per recipient. */
export const CHARS_PER_CREDIT = 160;

/** GSM 03.38 basic character set plus its extension table. */
const GSM_CHARS = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
    "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà" +
    "^{}\\[~]|€",
);

const LINK_PATTERN =
  /https?:\/\/|\bwww\.|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\//i;

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Result of {@link validateSmsContent}. */
export type SmsValidationResult =
  | { ok: true; content: string; credits: number }
  | { ok: false; errors: string[] };

/**
 * Replaces typographic characters that phones and word processors insert with
 * their plain equivalents, normalizes Windows line endings, and trims.
 *
 * @param s - Raw message text.
 * @returns The cleaned text.
 *
 * @example
 * sanitizeSmsText("“Evacuate” now – Purok 3…"); // '"Evacuate" now - Purok 3...'
 */
export function sanitizeSmsText(s: string): string {
  return s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/\r\n/g, "\n")
    .trim();
}

/**
 * Lists the characters an SMS cannot carry: anything outside the GSM 03.38
 * basic set and its extension table, such as emoji.
 *
 * Characters are compared as whole graphemes, so an emoji with a skin-tone
 * modifier is reported once, as the user sees it.
 *
 * @param s - Message text.
 * @returns Each unsupported character once, in order of first appearance.
 */
export function findUnsupportedChars(s: string): string[] {
  const found = new Set<string>();
  for (const { segment } of graphemes.segment(s)) {
    if (Array.from(segment).some((char) => !GSM_CHARS.has(char))) {
      found.add(segment);
    }
  }
  return [...found];
}

/**
 * Detects links: `http://` or `https://`, `www.`, and bare `domain.tld/path`
 * patterns such as `bit.ly/abc`.
 *
 * @param s - Message text.
 * @returns `true` if the text appears to contain a link.
 */
export function containsLink(s: string): boolean {
  return LINK_PATTERN.test(s);
}

/**
 * Estimates the credits one recipient costs, at one credit per
 * {@link CHARS_PER_CREDIT} characters.
 *
 * @param s - The final message text, prefix included.
 * @returns The credit count; 0 for an empty message.
 */
export function estimateCredits(s: string): number {
  return Math.ceil(s.length / CHARS_PER_CREDIT);
}

/**
 * Prepends the association prefix, unless the content already starts with it.
 *
 * @param content - Message text.
 * @param prefix - The prefix, such as `Mi-isi FA:`.
 * @returns `"<prefix> <content>"`, or the content unchanged if it is already prefixed.
 *
 * @example
 * withPrefix("Lahar warning", "Mi-isi FA:"); // "Mi-isi FA: Lahar warning"
 */
export function withPrefix(content: string, prefix: string): string {
  if (content.startsWith(prefix)) return content;
  return `${prefix} ${content}`;
}

/**
 * Sanitizes a message, then checks it against the SMS rules: not empty, at
 * most {@link SMS_MAX_CHARS} characters, GSM characters only, and no links
 * when `blockLinks` is on (the default sender ID cannot send links).
 *
 * @param s - Raw message text.
 * @param opts - `blockLinks`: reject messages that contain a link.
 * @returns The sanitized content and its credits per recipient, or every error found, in check order.
 */
export function validateSmsContent(
  s: string,
  opts: { blockLinks: boolean },
): SmsValidationResult {
  const content = sanitizeSmsText(s);
  const errors: string[] = [];

  if (content === "") {
    errors.push("Message is empty.");
  }
  if (content.length > SMS_MAX_CHARS) {
    errors.push(
      `Message is ${content.length} characters; the limit is ${SMS_MAX_CHARS}.`,
    );
  }
  const unsupported = findUnsupportedChars(content);
  if (unsupported.length > 0) {
    errors.push(`Remove unsupported characters: ${unsupported.join(" ")}`);
  }
  if (opts.blockLinks && containsLink(content)) {
    errors.push("Links can't be sent with the default sender ID.");
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, content, credits: estimateCredits(content) };
}
