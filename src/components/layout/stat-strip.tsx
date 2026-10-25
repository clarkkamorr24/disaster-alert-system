import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";

/** Color of a stat strip tile's icon. */
export type StatStripTone = "critical" | "moderate" | "clear" | "info" | "advisory";

const TILE_CLASS: Record<StatStripTone, string> = {
  critical: "bg-status-critical-soft text-status-critical",
  moderate: "bg-status-moderate-soft text-status-moderate",
  clear: "bg-status-clear-soft text-status-clear",
  info: "bg-status-info-soft text-status-info",
  advisory: "bg-status-advisory-soft text-status-advisory",
};

/** One tile of a {@link StatStrip}. */
export interface StatStripItem {
  label: string;
  /** The number, already formatted. */
  value: string;
  icon: LucideIcon;
  tone: StatStripTone;
}

const TILE_FRAME = "min-h-[86px] min-w-[180px] flex-1 border-r border-b border-[#e8ede9] dark:border-border";

/** One tile of a {@link StatStrip}, for tiles rendered on their own, such as inside `<Suspense>`. */
export function StatStripTile({ label, value, icon: Icon, tone }: StatStripItem) {
  return (
    <div
      className={cn(
        TILE_FRAME,
        "grid grid-cols-[36px_auto] grid-rows-[auto_auto] content-center justify-start gap-x-2.5 px-5 py-[15px]",
      )}
    >
      <span className={cn("row-span-2 grid size-9 place-items-center rounded-[9px]", TILE_CLASS[tone])}>
        <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <strong className="font-heading text-[19px] leading-[1.1] font-bold text-[#203028] tabular-nums dark:text-foreground">
        {value}
      </strong>
      <small className="col-start-2 row-start-2 text-[13px] text-[#7b8980] dark:text-muted-foreground">{label}</small>
    </div>
  );
}

/** A tile-sized placeholder for a {@link StatStripTile} that is still loading. */
export function StatStripTileSkeleton() {
  return (
    <div className={cn(TILE_FRAME, "flex items-center px-5")}>
      <span className="h-9 w-32 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

/**
 * Joined tiles in one card: a tinted icon, a number, and a small label. The
 * tiles wrap on narrow screens; borders sit only between tiles. `children`
 * are extra tiles after `items`, such as a {@link StatStripTile} in `<Suspense>`.
 */
export function StatStrip({ items, children }: { items: StatStripItem[]; children?: ReactNode }) {
  return (
    <div className="mb-[18px] overflow-hidden rounded-xl border bg-card">
      {/* Every tile has a right and bottom border; the negative margins hide the ones on the card's edge. */}
      <div className="-mr-px -mb-px flex flex-wrap">
        {items.map((item) => (
          <StatStripTile key={item.label} {...item} />
        ))}
        {children}
      </div>
    </div>
  );
}
