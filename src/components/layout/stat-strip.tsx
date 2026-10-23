import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

/** Color of a stat strip tile's icon. */
export type StatStripTone = "critical" | "moderate" | "clear" | "info";

const TILE_CLASS: Record<StatStripTone, string> = {
  critical: "bg-status-critical-soft text-status-critical",
  moderate: "bg-status-moderate-soft text-status-moderate",
  clear: "bg-status-clear-soft text-status-clear",
  info: "bg-status-info-soft text-status-info",
};

/** One tile of a {@link StatStrip}. */
export interface StatStripItem {
  label: string;
  /** The number, already formatted. */
  value: string;
  icon: LucideIcon;
  tone: StatStripTone;
}

/**
 * Joined tiles in one card: a tinted icon, a number, and a small label. The
 * tiles wrap on narrow screens; borders sit only between tiles.
 */
export function StatStrip({ items }: { items: StatStripItem[] }) {
  return (
    <div className="mb-[18px] overflow-hidden rounded-xl border bg-card">
      {/* Every tile has a right and bottom border; the negative margins hide the ones on the card's edge. */}
      <div className="-mr-px -mb-px flex flex-wrap">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="grid min-h-[86px] min-w-[180px] flex-1 grid-cols-[36px_auto] grid-rows-[auto_auto] content-center justify-start gap-x-2.5 border-r border-b border-[#e8ede9] px-5 py-[15px] dark:border-border"
          >
            <span className={cn("row-span-2 grid size-9 place-items-center rounded-[9px]", TILE_CLASS[tone])}>
              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <strong className="font-heading text-[19px] leading-[1.1] font-bold text-[#203028] tabular-nums dark:text-foreground">
              {value}
            </strong>
            <small className="col-start-2 row-start-2 text-[11px] text-[#7b8980] dark:text-muted-foreground">{label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
