import { cn } from "cn";

import type { Severity } from "@/generated/prisma/enums";

const DOT_CLASS: Record<Severity, string> = {
  CRITICAL: "bg-status-critical",
  HIGH: "bg-status-high",
  MODERATE: "bg-status-moderate",
  LOW: "bg-status-low",
};

/** A small dot in the severity's status color. Decorative: show the severity as text next to it. */
export function SeverityDot({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2 shrink-0 rounded-full", DOT_CLASS[severity], className)}
    />
  );
}
