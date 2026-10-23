import type { LucideIcon } from "lucide-react";

/** Display settings for one hazard type. */
export interface HazardConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  /** Official levels offered as suggestions; the field stays free text. */
  levelSuggestions: readonly string[];
}

/** Display settings for one severity. */
export interface SeverityConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  /** Higher is worse: Low = 1, Critical = 4. */
  rank: number;
}
