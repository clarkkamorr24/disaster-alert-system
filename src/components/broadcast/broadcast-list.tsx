import { CircleAlert, CircleCheck, CreditCard, MessageSquareText, Send } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BroadcastFilterPopover } from "@/components/broadcast/broadcast-filter-popover";
import { BroadcastTable } from "@/components/broadcast/broadcast-table";
import { PaginationFooter } from "@/components/layout/pagination-footer";
import { StatStrip, StatStripTile, StatStripTileSkeleton } from "@/components/layout/stat-strip";
import { SearchField, TableToolbar } from "@/components/layout/table-toolbar";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import {
  BROADCASTS_PER_PAGE,
  broadcastListHref,
  broadcastListWhere,
  parseBroadcastListFilters,
} from "@/lib/broadcast/list-filters";
import { deliveryRate, emptyStatusCounts, formatRate } from "@/lib/broadcast/status";
import { loadBroadcastSummaries, loadBroadcastZoneNames } from "@/lib/broadcast/summaries";
import { prisma } from "@/lib/db";
import { getSmsGateway } from "@/lib/sms";
import type { BroadcastListFilters } from "@/types/broadcast";

interface BroadcastListProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Counts for the stat strip; they ignore the search and filter. */
async function loadStats() {
  const [broadcastCount, groups] = await Promise.all([
    prisma.broadcast.count(),
    prisma.broadcastRecipient.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const counts = emptyStatusCounts();
  for (const group of groups) counts[group.status] = group._count._all;
  return [
    { label: "Broadcasts sent", value: broadcastCount.toLocaleString("en-US"), icon: MessageSquareText, tone: "info" as const },
    { label: "Delivery rate", value: formatRate(deliveryRate(counts)), icon: CircleCheck, tone: "clear" as const },
    {
      label: "Not reached",
      value: (counts.FAILED + counts.SKIPPED).toLocaleString("en-US"),
      icon: CircleAlert,
      tone: "critical" as const,
    },
  ];
}

/** The credit balance tile. Awaits the gateway, so render it inside `<Suspense>`. */
async function CreditTile() {
  const balance = await getSmsGateway().getCreditBalance();
  return (
    <StatStripTile
      label="Credits available"
      value={balance === null ? "—" : balance.toLocaleString("en-US")}
      icon={CreditCard}
      tone="advisory"
    />
  );
}

/** The page of broadcasts with their zones, and how many match. */
async function loadBroadcasts(filters: BroadcastListFilters) {
  const where = broadcastListWhere(filters);
  const [rows, total, totalZones] = await Promise.all([
    loadBroadcastSummaries(where, (filters.page - 1) * BROADCASTS_PER_PAGE, BROADCASTS_PER_PAGE),
    prisma.broadcast.count({ where }),
    prisma.farmZone.count(),
  ]);
  const zoneNames = await loadBroadcastZoneNames(rows.map((row) => row.id));
  return { rows, total, totalZones, zoneNames };
}

const LINK_CLASS = "inline-flex min-h-11 items-center text-xs font-bold text-link hover:text-primary-hover";

/** Shown instead of the table: past the last page, no matches, or no broadcasts yet. */
function EmptyState({ filters, pastEnd }: { filters: BroadcastListFilters; pastEnd: boolean }) {
  if (pastEnd) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center">
        <p className="text-sm text-muted-foreground">There are no broadcasts on this page.</p>
        <Link href={broadcastListHref(filters, 1)} className={LINK_CLASS}>
          Go to the first page
        </Link>
      </div>
    );
  }
  const filtered = filters.q !== "" || filters.kind !== "all";
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <MessageSquareText className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        {filtered ? "No broadcasts match your search." : "No broadcasts yet."}
      </p>
      {filtered ? (
        <Link href="/broadcasts" className={LINK_CLASS}>
          Clear filters
        </Link>
      ) : (
        <Link href="/broadcasts/new" className={buttonVariants({ className: "mt-1 h-11 gap-2 px-4 text-[13px]" })}>
          <Send data-icon="inline-start" />
          New broadcast
        </Link>
      )}
    </div>
  );
}

/**
 * The broadcast history: a stat strip, then a card with search, the kind
 * filter, the table, and 25 per page. Render inside `<Suspense>`.
 */
export async function BroadcastList({ searchParams }: BroadcastListProps) {
  const params = await searchParams;
  await requireOfficer();

  const filters = parseBroadcastListFilters(params);
  const now = new Date();
  const [stats, { rows, total, totalZones, zoneNames }] = await Promise.all([loadStats(), loadBroadcasts(filters)]);

  const skip = (filters.page - 1) * BROADCASTS_PER_PAGE;
  const lastPage = Math.max(1, Math.ceil(total / BROADCASTS_PER_PAGE));
  const pastEnd = total > 0 && filters.page > lastPage;

  return (
    <>
      <StatStrip items={stats}>
        <Suspense fallback={<StatStripTileSkeleton />}>
          <CreditTile />
        </Suspense>
      </StatStrip>
      <div className="overflow-hidden rounded-xl border bg-card">
        <TableToolbar>
          <SearchField
            action="/broadcasts"
            label="Search broadcasts"
            placeholder="Search broadcasts…"
            defaultValue={filters.q}
            keep={{ kind: filters.kind === "all" ? null : filters.kind }}
          />
          <BroadcastFilterPopover filters={filters} />
        </TableToolbar>
        {rows.length === 0 ? (
          <EmptyState filters={filters} pastEnd={pastEnd} />
        ) : (
          <BroadcastTable rows={rows} zoneNames={zoneNames} totalZones={totalZones} now={now} />
        )}
        <PaginationFooter
          from={rows.length === 0 ? 0 : skip + 1}
          to={skip + rows.length}
          total={total}
          noun={total === 1 ? "broadcast" : "broadcasts"}
          prevHref={filters.page > 1 ? broadcastListHref(filters, Math.min(filters.page - 1, lastPage)) : null}
          nextHref={skip + rows.length < total ? broadcastListHref(filters, filters.page + 1) : null}
        />
      </div>
    </>
  );
}

/** Placeholder while {@link BroadcastList} loads. */
export function BroadcastListSkeleton() {
  return (
    <>
      <Skeleton className="mb-[18px] h-[88px] rounded-xl" />
      <Skeleton className="h-[480px] rounded-xl" />
    </>
  );
}
