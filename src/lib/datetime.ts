/** The time zone every date is shown in. Dates are stored in UTC. */
export const DISPLAY_TIME_ZONE = "Asia/Manila";

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "long",
  timeZone: DISPLAY_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: DISPLAY_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
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

/**
 * Formats a date and time of day in Philippine time.
 *
 * @param date - A UTC instant.
 * @returns A short date and time, such as `Oct 22, 2026, 12:30 AM`.
 *
 * @example
 * formatManilaDateTime(new Date("2026-10-21T16:30:00Z")); // "Oct 22, 2026, 12:30 AM"
 */
export function formatManilaDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}

/**
 * Formats a time of day in Philippine time.
 *
 * @param date - A UTC instant.
 * @returns A time such as `8:45 AM`.
 *
 * @example
 * formatManilaTime(new Date("2026-10-23T00:45:00Z")); // "8:45 AM"
 */
export function formatManilaTime(date: Date): string {
  return timeFormatter.format(date);
}
