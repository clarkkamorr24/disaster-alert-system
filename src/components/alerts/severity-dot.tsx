import { cn } from "cn";

import type { Severity } from "@/generated/prisma/enums";

const DOT_CLASS: Record<Severity, string> = {
  CRITICAL: "bg-status-critical",
  HIGH: "bg-status-high",
  MODERATE: "bg-status-moderate",
  LOW: "bg-status-low",
};

interface SeverityDotProps {
  severity: Severity;
  /** Pulses the dot for an active Critical alert (see `isCriticalActive`). */
  pulse?: boolean;
  className?: string;
}

/** A small dot in the severity's status color. Decorative: show the severity as text next to it. */
export function SeverityDot({ severity, pulse = false, className }: SeverityDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        DOT_CLASS[severity],
        pulse && "critical-ping",
        className,
      )}
    />
  );
}
