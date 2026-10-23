import { validateSmsContent } from "@/lib/domain/sms-text";
import { renderTemplate, TEMPLATE_PLACEHOLDERS } from "@/lib/templates/render";
import type { ComposeAlert, ComposeTemplate } from "@/types/broadcast";

/** Shown when a broadcast is sent without any zone. */
export const NO_BROADCAST_ZONES_MESSAGE = "Select at least one zone.";

/** Shown when the selected zones have no active members. */
export const NO_MEMBERS_MESSAGE = "No active members in the selected zones.";

/** Shown when a resend has nobody left to go to. */
export const NO_UNREACHED_MESSAGE = "Nobody to resend to: the members who weren't reached are no longer active.";

/** Shown when the estimated cost exceeds the known credit balance. */
export const NOT_ENOUGH_CREDITS_MESSAGE = "Not enough SMS credits. Top up UniSMS first.";

/** The seeded template used for an active alert when no template matches its hazard. */
export const GENERAL_TEMPLATE_NAME = "General hazard alert";

/** The seeded template used for a resolved alert. */
export const ALL_CLEAR_TEMPLATE_NAME = "All clear";

/**
 * Chooses the template a broadcast starts from.
 *
 * For an active alert, the first template for its hazard type, falling back
 * to {@link GENERAL_TEMPLATE_NAME}. For a resolved alert,
 * {@link ALL_CLEAR_TEMPLATE_NAME}. Without an alert, none.
 *
 * @param templates - The templates to choose from, in display order.
 * @param alert - The alert's hazard type and status, or `null` for a general announcement.
 * @returns The chosen template, or `null` when none fits.
 */
export function pickDefaultTemplate<T extends Pick<ComposeTemplate, "name" | "hazardType">>(
  templates: T[],
  alert: { hazardType: ComposeTemplate["hazardType"]; status: "ACTIVE" | "RESOLVED" } | null,
): T | null {
  if (!alert) return null;
  const byName = (name: string) => templates.find((template) => template.name === name) ?? null;
  if (alert.status === "RESOLVED") return byName(ALL_CLEAR_TEMPLATE_NAME);
  return templates.find((template) => template.hazardType === alert.hazardType) ?? byName(GENERAL_TEMPLATE_NAME);
}

/**
 * Fills a template for the compose form. With an alert, every placeholder
 * gets the alert's values. Without one, only `{date}` is filled, and
 * `{hazard}`, `{level}`, and `{zones}` are left for the officer to replace.
 *
 * @param body - Template text.
 * @param alert - The alert the broadcast is about, or `null`.
 * @param date - The value for `{date}`.
 * @returns The message, without the SMS prefix.
 */
export function renderComposeMessage(
  body: string,
  alert: Pick<ComposeAlert, "hazard" | "level" | "zoneNames"> | null,
  date: Date,
): string {
  if (alert) return renderTemplate(body, { hazard: alert.hazard, level: alert.level, zones: alert.zoneNames, date });
  // Each value reproduces its own placeholder, so only {date} changes.
  return renderTemplate(body, { hazard: "{hazard}", level: "{level}", zones: ["{zones}"], date });
}

/**
 * Lists the template placeholders still in a message, such as `{hazard}`
 * left over from a general announcement.
 *
 * @param message - Message text.
 * @returns Each placeholder found, with braces, in {@link TEMPLATE_PLACEHOLDERS} order.
 */
export function findUnfilledPlaceholders(message: string): string[] {
  return TEMPLATE_PLACEHOLDERS.map((name) => `{${name}}`).filter((token) => message.includes(token));
}

/**
 * The error shown while a message still has placeholders.
 *
 * @param placeholders - From {@link findUnfilledPlaceholders}; at least one.
 * @returns A sentence asking the officer to replace them.
 */
export function unfilledPlaceholderMessage(placeholders: string[]): string {
  return `Replace ${placeholders.join(", ")} with the actual text.`;
}

/**
 * Lists what keeps a message from being sent, in the order the officer
 * should fix it: placeholders left in, then the SMS rules.
 *
 * @param body - The sanitized message without the prefix; `""` gives no errors.
 * @param text - The same message with the prefix.
 * @param blockLinks - Whether links are blocked (the default sender ID can't send them).
 * @returns The problems, or an empty list.
 */
export function composeMessageErrors(body: string, text: string, blockLinks: boolean): string[] {
  if (body === "") return [];
  const unfilled = findUnfilledPlaceholders(body);
  const validation = validateSmsContent(text, { blockLinks });
  return [
    ...(unfilled.length > 0 ? [unfilledPlaceholderMessage(unfilled)] : []),
    ...(validation.ok ? [] : validation.errors),
  ];
}
