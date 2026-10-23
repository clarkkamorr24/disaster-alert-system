import type { Severity } from "@/generated/prisma/enums";

/**
 * A status color family from the design tokens (`--status-<tone>` text and
 * `--status-<tone>-soft` background).
 */
export type StatusTone = "critical" | "high" | "moderate" | "low" | "clear" | "neutral";

/** The tones {@link severityTone} gives: one per severity, plus `clear`. */
export type SeverityTone = Exclude<StatusTone, "neutral">;

const SEVERITY_TONES: Record<Severity, SeverityTone> = {
  CRITICAL: "critical",
  HIGH: "high",
  MODERATE: "moderate",
  LOW: "low",
};

/**
 * Picks the status tone for a severity, such as a zone's worst active alert.
 *
 * @param severity - A severity, or `null` when nothing is active.
 * @returns The severity's tone, or `clear` for `null`.
 *
 * @example
 * severityTone("CRITICAL"); // "critical"
 * severityTone(null); // "clear"
 */
export function severityTone(severity: Severity | null): SeverityTone {
  return severity ? SEVERITY_TONES[severity] : "clear";
}
