import { MessageSquareText } from "lucide-react";

import { BroadcastRows } from "@/components/broadcast/broadcast-rows";
import { SectionHeader, SectionHeaderSkeleton } from "@/components/dashboard/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { loadBroadcastSummaries, loadBroadcastZoneNames } from "@/lib/broadcast/summaries";
import { prisma } from "@/lib/db";

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
        <BroadcastRows broadcasts={broadcasts} zoneNames={zoneNames} totalZones={totalZones} />
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
