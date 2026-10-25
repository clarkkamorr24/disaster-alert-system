import { MapPin, Plus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrentConditions } from "@/components/zones/current-conditions";
import { FullMapDialog } from "@/components/zones/full-map-dialog";
import { ZoneCard } from "@/components/zones/zone-card";
import { ZoneMapClient } from "@/components/zones/zone-map-client";
import { requireOfficer } from "@/lib/auth/dal";
import { formatManilaTime } from "@/lib/datetime";
import { loadZoneOverview } from "@/lib/zones/overview";

function overviewSubtitle(count: number, weatherUpdatedAt: Date | null): string {
  const zones = `${count} ${count === 1 ? "zone" : "zones"}`;
  if (count === 0) return zones;
  return `${zones} · ${weatherUpdatedAt ? `Weather updated ${formatManilaTime(weatherUpdatedAt)}` : "Weather unavailable"}`;
}

/**
 * The zones page body: the map card and the Current conditions card, then a
 * card per zone. Loads the weather once for all three. Render inside `<Suspense>`.
 */
export async function ZonesOverview() {
  await requireOfficer();
  const { zones, weather, weatherUpdatedAt } = await loadZoneOverview();

  return (
    <>
      <div className="flex flex-wrap items-stretch gap-3.5">
        <section
          aria-labelledby="zone-overview-heading"
          className="flex min-w-0 flex-[1.8_1_480px] flex-col overflow-hidden rounded-xl border bg-card max-sm:basis-full"
        >
          <div className="flex min-h-[65px] items-center justify-between gap-2 border-b px-4 py-3">
            <div className="min-w-0">
              <h2 id="zone-overview-heading" className="font-heading text-[15px] font-semibold tracking-[-0.03em]">
                Zone overview
              </h2>
              <p className="mt-[3px] text-[13px] text-subtle-foreground">
                {overviewSubtitle(zones.length, weatherUpdatedAt)}
              </p>
            </div>
            <FullMapDialog zones={zones} />
          </div>
          <ZoneMapClient zones={zones} className="h-[340px]" />
        </section>
        <CurrentConditions zones={zones} weather={weather} />
      </div>

      {zones.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-8 text-center">
          <MapPin className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No zones yet.</p>
          <Link href="/zones/new" className={buttonVariants({ className: "h-11 gap-2 px-4 text-[13px]" })}>
            <Plus data-icon="inline-start" />
            Add zone
          </Link>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          {zones.map((zone) => (
            <li key={zone.id} className="grid">
              <ZoneCard zone={zone} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Placeholder while {@link ZonesOverview} loads: both cards of the top row and a row of zone cards. */
export function ZonesOverviewSkeleton() {
  return (
    <>
      <div className="flex flex-wrap gap-3.5">
        <Skeleton className="h-[407px] min-w-0 flex-[1.8_1_480px] rounded-xl max-sm:basis-full" />
        <Skeleton className="h-[407px] min-w-0 flex-[.7_1_260px] rounded-xl" />
      </div>
      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[165px] rounded-[11px]" />
        ))}
      </div>
    </>
  );
}
