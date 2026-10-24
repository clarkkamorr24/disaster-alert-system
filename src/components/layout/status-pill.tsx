import type { ReactNode } from "react";
import { cn } from "cn";

import type { StatusTone } from "@/lib/domain/status-tone";

const PILL_CLASS: Record<StatusTone, string> = {
  critical: "bg-status-critical-soft text-status-critical",
  high: "bg-status-high-soft text-status-high",
  moderate: "bg-status-moderate-soft text-status-moderate",
  low: "bg-status-low-soft text-status-low",
  clear: "bg-status-clear-soft text-status-clear",
  neutral: "bg-muted text-status-neutral",
};

const DOT_CLASS: Record<StatusTone, string> = {
  critical: "bg-status-critical",
  high: "bg-status-high",
  moderate: "bg-status-moderate",
  low: "bg-status-low",
  clear: "bg-status-clear",
  neutral: "bg-status-neutral",
};

const TEXT_CLASS: Record<StatusTone, string> = {
  critical: "text-status-critical",
  high: "text-status-high",
  moderate: "text-status-moderate",
  low: "text-status-low",
  clear: "text-status-clear",
  neutral: "text-status-neutral",
};

/** A small dot in a status color. Decorative: show the status as text next to it. */
export function StatusDot({ tone, className }: { tone: StatusTone; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-block size-[7px] shrink-0 rounded-full", DOT_CLASS[tone], className)} />
  );
}

interface StatusPillProps {
  tone: StatusTone;
  /** Pulses the dot for an active Critical state (see `isCriticalActive`). */
  pulse?: boolean;
  children: ReactNode;
}

/** A status label on a soft background with a dot, such as `CRITICAL` or `CLEAR`. */
export function StatusPill({ tone, pulse = false, children }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-[9px] text-[10px] font-bold whitespace-nowrap uppercase",
        PILL_CLASS[tone],
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full bg-current", pulse && "critical-ping")} />
      {children}
    </span>
  );
}

/** A status label in its status color with a dot before it, such as `● Completed`. */
export function StatusText({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap",
        TEXT_CLASS[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}
