import { ChevronRight, MessageSquareText } from "lucide-react";
import Link from "next/link";

import { SectionHeader, SectionHeaderSkeleton } from "@/components/dashboard/section-header";
import { StatusDot } from "@/components/layout/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { loadBroadcastSummaries, loadBroadcastZoneNames } from "@/lib/broadcast/summaries";
import { formatManilaDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { zonesLabel } from "@/lib/domain/zones-label";

/** How many broadcasts the dashboard lists. */
const RECENT_BROADCAST_COUNT = 5;

/** The 5 newest broadcasts with their zones and delivery counts. Render inside `<Suspense>`. */
export async function RecentBroadcasts() {
  await requireOfficer();
  const [broadcasts, totalZones] = await Promise.all([
    loadBroadcastSummaries(0, RECENT_BROADCAST_COUNT),
    prisma.farmZone.count(),
  ]);
  const zoneNames = await loadBroadcastZoneNames(broadcasts.map((broadcast) => broadcast.id));

  return (
    <section aria-labelledby="recent-broadcasts-heading">
      <SectionHeader
        id="recent-broadcasts-heading"
        title="Recent broadcasts"
        description="Latest messages sent to association members"
        href="/broadcasts"
        linkLabel="View history"
      />

      {broadcasts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card p-6 text-center">
          <MessageSquareText className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No broadcasts yet.</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card">
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
                  <small className="text-[11px] text-[#879289] dark:text-muted-foreground">
                    {zonesLabel(zoneNames.get(broadcast.id) ?? [], totalZones)} ·{" "}
                    {formatManilaDateTime(broadcast.createdAt)}
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
      )}
    </section>
  );
}

/** Placeholder while {@link RecentBroadcasts} loads. */
export function RecentBroadcastsSkeleton() {
  return (
    <div>
      <SectionHeaderSkeleton />
      <Skeleton className="h-[340px] rounded-xl" />
    </div>
  );
}
