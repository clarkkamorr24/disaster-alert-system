import { ChevronRight, MessageSquareText, Repeat } from "lucide-react";
import Link from "next/link";

import { DeliveryBar } from "@/components/broadcast/delivery-bar";
import { StatusText } from "@/components/layout/status-pill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RecipientStatus } from "@/generated/prisma/enums";
import { BROADCAST_STATUS_LABELS, BROADCAST_STATUS_TONES, deliveryBreakdown } from "@/lib/broadcast/status";
import { formatRelativeManila } from "@/lib/datetime";
import { zonesLabel } from "@/lib/domain/zones-label";
import type { BroadcastStatus } from "@/types/broadcast";

/** One broadcast as the history table shows it, from `loadBroadcastSummaries`. */
export interface BroadcastTableRow {
  id: string;
  title: string;
  createdAt: Date;
  retryOfId: string | null;
  counts: Record<RecipientStatus, number>;
  recipientCount: number;
  status: BroadcastStatus;
}

interface BroadcastTableProps {
  rows: BroadcastTableRow[];
  /** From `loadBroadcastZoneNames`. */
  zoneNames: Map<string, string[]>;
  totalZones: number;
  /** For `Today` / `Yesterday`. */
  now: Date;
}

function ResendTag() {
  return (
    <span className="inline-flex min-h-5 items-center gap-1 rounded-md bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
      <Repeat className="size-3" aria-hidden="true" />
      Resend
    </span>
  );
}

/** The broadcast history's table; each row links to its report. Scrolls inside its card below 850px. */
export function BroadcastTable({ rows, zoneNames, totalZones, now }: BroadcastTableProps) {
  return (
    <Table className="min-w-[850px]">
      <TableHeader>
        <TableRow>
          <TableHead>Broadcast</TableHead>
          <TableHead>Recipients</TableHead>
          <TableHead>Delivery</TableHead>
          <TableHead>Sent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <span className="sr-only">Open</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((broadcast) => {
          const sentAt = formatRelativeManila(broadcast.createdAt, now);
          const delivery = deliveryBreakdown(broadcast.counts);
          return (
            <TableRow key={broadcast.id} className="relative">
              <TableCell className="h-[67px]">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-status-clear-soft text-link">
                    <MessageSquareText className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    {/* The link covers the whole row, so a click anywhere on it opens the report. */}
                    <Link
                      href={`/broadcasts/${broadcast.id}`}
                      className="max-w-[260px] truncate text-xs font-semibold text-title-foreground outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/25 focus-visible:after:ring-inset"
                    >
                      {broadcast.title}
                    </Link>
                    <small className="text-[11px] text-subtle-foreground">{sentAt}</small>
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold text-title-foreground tabular-nums">
                    {broadcast.recipientCount.toLocaleString("en-US")}
                  </span>
                  <small className="text-[11px] text-subtle-foreground">
                    {zonesLabel(zoneNames.get(broadcast.id) ?? [], totalZones)}
                  </small>
                </span>
              </TableCell>
              <TableCell>
                <span className="flex w-40 flex-col gap-1.5">
                  <span className="flex justify-between gap-2 text-[10px] tabular-nums">
                    <span>{delivery.sent.toLocaleString("en-US")} sent</span>
                    <span>{delivery.notReached.toLocaleString("en-US")} not reached</span>
                  </span>
                  <DeliveryBar {...delivery} className="h-1 w-40" />
                </span>
              </TableCell>
              <TableCell>{sentAt}</TableCell>
              <TableCell>
                <span className="flex flex-wrap items-center gap-2">
                  <StatusText tone={BROADCAST_STATUS_TONES[broadcast.status]}>
                    {BROADCAST_STATUS_LABELS[broadcast.status]}
                  </StatusText>
                  {broadcast.retryOfId && <ResendTag />}
                </span>
              </TableCell>
              <TableCell>
                <ChevronRight className="ml-auto size-4 text-subtle-foreground" aria-hidden="true" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
