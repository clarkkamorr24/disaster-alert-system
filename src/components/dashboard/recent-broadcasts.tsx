import { ChevronRight, MessageSquareText } from "lucide-react";
import Link from "next/link";

import { BroadcastAbout } from "@/components/broadcast/broadcast-list";
import { BroadcastStatusBadge } from "@/components/broadcast/broadcast-status-badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { loadBroadcastSummaries } from "@/lib/broadcast/summaries";
import { formatManilaDateTime } from "@/lib/datetime";

/** How many broadcasts the dashboard lists. */
const RECENT_BROADCAST_COUNT = 5;

/** The 5 newest broadcasts with their recipients and derived status. Render inside `<Suspense>`. */
export async function RecentBroadcasts() {
  await requireOfficer();
  const broadcasts = await loadBroadcastSummaries(0, RECENT_BROADCAST_COUNT);

  return (
    <section aria-labelledby="recent-broadcasts-heading" className="flex flex-col gap-3">
      <SectionHeader id="recent-broadcasts-heading" title="Recent broadcasts" viewAllHref="/broadcasts" />

      {broadcasts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
          <MessageSquareText className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">No broadcasts yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl border bg-card">
          {broadcasts.map((broadcast) => (
            <li key={broadcast.id}>
              <Link
                href={`/broadcasts/${broadcast.id}`}
                className="flex min-h-11 items-center justify-between gap-3 p-4 hover:bg-muted"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <span className="font-medium sm:w-44 sm:shrink-0">{formatManilaDateTime(broadcast.createdAt)}</span>
                  <span className="min-w-0 sm:flex-1">
                    <BroadcastAbout alert={broadcast.alert} />
                  </span>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {broadcast.recipientCount} {broadcast.recipientCount === 1 ? "member" : "members"}
                    </span>
                    <BroadcastStatusBadge status={broadcast.status} />
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
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
    <div className="flex flex-col gap-3">
      <Skeleton className="h-11 w-48" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
