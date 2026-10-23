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

/** Manila's offset from UTC. The Philippines has no daylight saving time. */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: DISPLAY_TIME_ZONE,
});

const monthDayYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: DISPLAY_TIME_ZONE,
});

/** The instant shifted so its UTC fields read as Manila's wall clock. */
function manilaWallClock(date: Date): Date {
  return new Date(date.getTime() + MANILA_OFFSET_MS);
}

function manilaDayKey(date: Date): string {
  return manilaWallClock(date).toISOString().slice(0, 10);
}

/**
 * Finds midnight on 1 January of the current Manila calendar year.
 *
 * @param now - The current instant.
 * @returns That midnight as a UTC instant.
 *
 * @example
 * startOfManilaYear(new Date("2026-01-01T15:00:00Z")); // 2025-12-31T16:00:00.000Z
 */
export function startOfManilaYear(now: Date): Date {
  const year = manilaWallClock(now).getUTCFullYear();
  return new Date(Date.UTC(year, 0, 1) - MANILA_OFFSET_MS);
}

/**
 * Formats a date relative to today in Philippine time: `Today, 8:24 AM`,
 * `Yesterday, 4:16 PM`, `May 18, 2:10 PM`, or with the year when it isn't
 * the current one, `Dec 30, 2025, 9:00 AM`.
 *
 * @param date - A UTC instant.
 * @param now - The current instant.
 * @returns The label.
 */
export function formatRelativeManila(date: Date, now: Date): string {
  const time = formatManilaTime(date);
  const day = manilaDayKey(date);
  if (day === manilaDayKey(now)) return `Today, ${time}`;
  if (day === manilaDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return `Yesterday, ${time}`;
  const sameYear = manilaWallClock(date).getUTCFullYear() === manilaWallClock(now).getUTCFullYear();
  return `${(sameYear ? monthDayFormatter : monthDayYearFormatter).format(date)}, ${time}`;
}
