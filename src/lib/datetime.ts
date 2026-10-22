/** The time zone every date is shown in. Dates are stored in UTC. */
export const DISPLAY_TIME_ZONE = "Asia/Manila";

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "long",
  timeZone: DISPLAY_TIME_ZONE,
});

/**
 * Formats a date as a calendar day in Philippine time.
 *
 * @param date - A UTC instant.
 * @returns A date such as `October 22, 2026`.
 *
 * @example
 * formatManilaDate(new Date("2026-10-21T16:30:00Z")); // "October 22, 2026"
 */
export function formatManilaDate(date: Date): string {
  return dateFormatter.format(date);
}
