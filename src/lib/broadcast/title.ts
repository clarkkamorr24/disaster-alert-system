/** How many characters of an announcement's message make its title. */
export const BROADCAST_TITLE_LENGTH = 40;

/** What {@link broadcastTitle} needs from a broadcast. */
export interface BroadcastTitleInput {
  /** The linked alert's title, or `null` for a general announcement. */
  alertTitle: string | null;
  /** The stored message, prefix included. */
  content: string;
  /** The association prefix, such as `Mi-isi FA:`. */
  prefix: string;
}

/**
 * Names a broadcast in lists and search results.
 *
 * A broadcast about an alert is named after the alert. An announcement is
 * named after its message, without the association prefix, cut to
 * {@link BROADCAST_TITLE_LENGTH} characters with `…`.
 *
 * @returns The alert title, or the start of the message.
 *
 * @example
 * broadcastTitle({ alertTitle: null, content: "Mi-isi FA: Meeting on Friday", prefix: "Mi-isi FA:" });
 * // "Meeting on Friday"
 */
export function broadcastTitle({ alertTitle, content, prefix }: BroadcastTitleInput): string {
  if (alertTitle) return alertTitle;
  const text = (content.startsWith(prefix) ? content.slice(prefix.length) : content).trim();
  if (text.length <= BROADCAST_TITLE_LENGTH) return text;
  return `${text.slice(0, BROADCAST_TITLE_LENGTH).trimEnd()}…`;
}
