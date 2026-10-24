/**
 * Describes how many broadcasts used a template.
 *
 * @param count - Broadcasts sent with the template (only those since templates were recorded on broadcasts).
 * @returns `Not used yet`, `Used once`, or `Used N times`.
 */
export function usageLabel(count: number): string {
  if (count === 0) return "Not used yet";
  if (count === 1) return "Used once";
  return `Used ${count.toLocaleString("en-US")} times`;
}
