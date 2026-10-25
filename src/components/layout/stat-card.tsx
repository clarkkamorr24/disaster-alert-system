import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

/** Color of a stat card's icon tile. */
export type StatCardTone = "critical" | "clear" | "info" | "advisory";

const TILE_CLASS: Record<StatCardTone, string> = {
  critical: "bg-status-critical-soft text-status-critical",
  clear: "bg-status-clear-soft text-status-clear",
  info: "bg-status-info-soft text-status-info",
  advisory: "bg-status-advisory-soft text-status-advisory",
};

interface StatCardProps {
  label: string;
  /** The big number, already formatted. */
  value: string;
  /** Small line under the number. */
  hint: string;
  icon: LucideIcon;
  tone: StatCardTone;
  /** Puts a pulsing Critical dot before the hint, such as when any active alert is Critical. */
  hintPulse?: boolean;
}

/** A dashboard tile: tinted icon, label, a big number, and a small line under it. */
export function StatCard({ label, value, hint, icon: Icon, tone, hintPulse = false }: StatCardProps) {
  return (
    <div className="flex min-h-[112px] items-start gap-[13px] rounded-xl border bg-card p-[19px]">
      <span className={cn("grid size-[39px] shrink-0 place-items-center rounded-[10px]", TILE_CLASS[tone])}>
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <strong className="mt-[3px] mb-px font-heading text-[25px] leading-[1.25] font-bold tabular-nums">
          {value}
        </strong>
        <small className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          {hintPulse && (
            <span aria-hidden="true" className="critical-ping size-1.5 shrink-0 rounded-full bg-status-critical" />
          )}
          {hint}
        </small>
      </div>
    </div>
  );
}
