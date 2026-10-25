import { ChevronRight, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

import { StatusDot } from "@/components/layout/status-pill";
import { formatManilaDateTime } from "@/lib/datetime";
import { zonesLabel } from "@/lib/domain/zones-label";

/** What one row needs from `loadBroadcastSummaries`. */
interface BroadcastRow {
  id: string;
  title: string;
  createdAt: Date;
  sent: number;
  notReached: number;
}

interface BroadcastRowsProps {
  broadcasts: BroadcastRow[];
  /** From `loadBroadcastZoneNames`. */
  zoneNames: Map<string, string[]>;
  totalZones: number;
  className?: string;
}

/** Broadcast rows with a chat icon, title, zones and time, sent and not-reached counts, each linking to the report. */
export function BroadcastRows({ broadcasts, zoneNames, totalZones, className }: BroadcastRowsProps) {
  return (
    <ul className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      {broadcasts.map((broadcast) => (
        <li key={broadcast.id} className="border-b border-row-border last:border-b-0">
          <Link
            href={`/broadcasts/${broadcast.id}`}
            className="flex min-h-[68px] flex-wrap items-center gap-[13px] px-4 py-2.5 transition-colors hover:bg-row-hover"
          >
            <span className="grid size-[37px] shrink-0 place-items-center rounded-[9px] bg-status-clear-soft text-link">
              <MessageSquareText className="size-[19px]" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-[3px]">
              <strong className="text-[13px] font-semibold">{broadcast.title}</strong>
              <small className="text-[13px] text-[#879289] dark:text-muted-foreground">
                {zonesLabel(zoneNames.get(broadcast.id) ?? [], totalZones)} · {formatManilaDateTime(broadcast.createdAt)}
              </small>
            </span>
            <span className="flex min-w-[100px] items-center gap-1.5 text-xs text-[#647269] tabular-nums dark:text-muted-foreground">
              <StatusDot tone="clear" />
              {broadcast.sent.toLocaleString("en-US")} sent
            </span>
            <span className="flex min-w-[120px] items-center gap-1.5 text-xs text-[#647269] tabular-nums dark:text-muted-foreground">
              <StatusDot tone="critical" />
              {broadcast.notReached.toLocaleString("en-US")} not reached
            </span>
            <ChevronRight className="ml-auto size-4 shrink-0 text-[#96a198]" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
