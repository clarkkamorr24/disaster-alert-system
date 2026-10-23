import { DISPLAY_TIME_ZONE } from "@/lib/datetime";
import type { TemplateVars } from "@/types/template";

/** The placeholders a template body may use, without braces. */
export const TEMPLATE_PLACEHOLDERS = ["hazard", "level", "zones", "date"] as const;

/** One of {@link TEMPLATE_PLACEHOLDERS}. */
export type TemplatePlaceholder = (typeof TEMPLATE_PLACEHOLDERS)[number];

const PLACEHOLDER_PATTERN = /\{([^{}]+)\}/g;

/** A placeholder, optionally preceded by ` - ` so an empty value can take the separator with it. */
const RENDER_PATTERN = /( - )?\{([^{}]+)\}/g;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function isPlaceholder(name: string): name is TemplatePlaceholder {
  return (TEMPLATE_PLACEHOLDERS as readonly string[]).includes(name);
}

/**
 * Lists the names inside `{…}` that aren't one of {@link TEMPLATE_PLACEHOLDERS}.
 *
 * @param body - Template text.
 * @returns Each unknown name once, without braces, in order of first appearance.
 *
 * @example
 * findUnknownPlaceholders("Hi {hazrd} {zones}"); // ["hazrd"]
 */
export function findUnknownPlaceholders(body: string): string[] {
  const unknown = new Set<string>();
  for (const [, name] of body.matchAll(PLACEHOLDER_PATTERN)) {
    if (!isPlaceholder(name)) unknown.add(name);
  }
  return [...unknown];
}

/**
 * Formats a date for `{date}`, such as `Oct 22, 2:30 PM`, in Philippine time.
 *
 * Some ICU versions put a narrow no-break space before AM/PM; it is replaced
 * with a plain space because SMS can't carry it.
 */
function formatTemplateDate(date: Date): string {
  return dateFormatter.format(date).replace(/[  ]/g, " ");
}

/**
 * Fills a template's placeholders.
 *
 * `{zones}` joins the zone names with `, `, and `{date}` is formatted like
 * `Oct 22, 2:30 PM` in Philippine time. An empty value is removed together
 * with an immediately preceding ` - `. Unknown placeholders are left as written.
 *
 * @param body - Template text.
 * @param vars - The values to fill in.
 * @returns The filled-in text, without the SMS prefix.
 *
 * @example
 * renderTemplate("{hazard} - {level}", { hazard: "Lahar", level: "", zones: [], date }); // "Lahar"
 */
export function renderTemplate(body: string, vars: TemplateVars): string {
  const values: Record<TemplatePlaceholder, string> = {
    hazard: vars.hazard,
    level: vars.level,
    zones: vars.zones.join(", "),
    date: formatTemplateDate(vars.date),
  };

  return body.replace(RENDER_PATTERN, (match, separator: string | undefined, name: string) => {
    if (!isPlaceholder(name)) return match;
    const value = values[name];
    if (value === "") return "";
    return `${separator ?? ""}${value}`;
  });
}
