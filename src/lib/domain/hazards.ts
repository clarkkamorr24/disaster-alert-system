import { CloudFog, CloudRain, Droplets, Mountain, Waves, Wind } from "lucide-react";
import type { HazardType, Severity } from "@/generated/prisma/enums";
import type { HazardConfig, SeverityConfig } from "@/types/hazard";

const PHIVOLCS_LEVELS = [0, 1, 2, 3, 4, 5].map((level) => `Alert Level ${level}`);
const TCWS_SIGNALS = [1, 2, 3, 4, 5].map((signal) => `Signal No. ${signal}`);
const RAINFALL_WARNINGS = [
  "Yellow Rainfall Warning",
  "Orange Rainfall Warning",
  "Red Rainfall Warning",
];

/** Label, Lucide icon, color, and official level suggestions for each hazard type. */
export const HAZARD_TYPES: Record<HazardType, HazardConfig> = {
  VOLCANIC_ERUPTION: {
    label: "Volcanic eruption",
    icon: Mountain,
    color: "#dc2626",
    levelSuggestions: PHIVOLCS_LEVELS,
  },
  ASHFALL: {
    label: "Ashfall",
    icon: CloudFog,
    color: "#78716c",
    levelSuggestions: PHIVOLCS_LEVELS,
  },
  LAHAR: {
    label: "Lahar",
    icon: Waves,
    color: "#a16207",
    levelSuggestions: RAINFALL_WARNINGS,
  },
  TYPHOON: {
    label: "Typhoon",
    icon: Wind,
    color: "#2563eb",
    levelSuggestions: TCWS_SIGNALS,
  },
  HEAVY_RAIN: {
    label: "Heavy rain",
    icon: CloudRain,
    color: "#0284c7",
    levelSuggestions: RAINFALL_WARNINGS,
  },
  FLOOD: {
    label: "Flood",
    icon: Droplets,
    color: "#0891b2",
    levelSuggestions: RAINFALL_WARNINGS,
  },
};

/** Label, color, and rank (1 = Low … 4 = Critical) for each severity. */
export const SEVERITIES: Record<Severity, SeverityConfig> = {
  LOW: { label: "Low", color: "#16a34a", rank: 1 },
  MODERATE: { label: "Moderate", color: "#ca8a04", rank: 2 },
  HIGH: { label: "High", color: "#ea580c", rank: 3 },
  CRITICAL: { label: "Critical", color: "#dc2626", rank: 4 },
};

/**
 * Returns the highest-ranked severity in a list.
 *
 * @param list - Severities, in any order; duplicates are fine.
 * @returns The worst severity, or `null` when the list is empty.
 *
 * @example
 * worstSeverity(["LOW", "CRITICAL", "MODERATE"]); // "CRITICAL"
 */
export function worstSeverity(list: Severity[]): Severity | null {
  let worst: Severity | null = null;
  for (const severity of list) {
    if (worst === null || SEVERITIES[severity].rank > SEVERITIES[worst].rank) {
      worst = severity;
    }
  }
  return worst;
}
