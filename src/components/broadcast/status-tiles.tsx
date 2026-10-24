import { cn } from "cn";

import type { RecipientStatus } from "@/generated/prisma/enums";

const TILES: { label: string; statuses: RecipientStatus[]; className: string }[] = [
  { label: "Queued", statuses: ["PENDING"], className: "text-title-foreground" },
  { label: "Sent", statuses: ["SENT"], className: "text-status-clear" },
  { label: "Not reached", statuses: ["FAILED", "SKIPPED"], className: "text-status-critical" },
  { label: "Retrying", statuses: ["RETRYING"], className: "text-status-moderate" },
];

/** Count tiles for the report: Queued (pending), Sent, Not reached (failed + skipped), and Retrying. */
export function StatusTiles({ counts }: { counts: Record<RecipientStatus, number> }) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2.5">
      {TILES.map((tile) => (
        <div key={tile.label} className="flex flex-col gap-1 rounded-[9px] border px-3.5 py-3">
          <dt className="text-[11px] text-muted-foreground">{tile.label}</dt>
          <dd className={cn("font-heading text-xl leading-none font-bold tabular-nums", tile.className)}>
            {tile.statuses.reduce((sum, status) => sum + counts[status], 0).toLocaleString("en-US")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
