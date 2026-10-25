import { MapPin, Plus, SearchX } from "lucide-react";
import Link from "next/link";

import { ViewToggle } from "@/components/layout/segmented-control";
import { SearchField, TableToolbar } from "@/components/layout/table-toolbar";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrentConditions } from "@/components/zones/current-conditions";
import { FullMapDialog } from "@/components/zones/full-map-dialog";
import { ZoneCard } from "@/components/zones/zone-card";
import { ZoneMapClient } from "@/components/zones/zone-map-client";
import { ZoneStatusFilter } from "@/components/zones/zone-status-filter";
import { ZoneTable } from "@/components/zones/zone-table";
import { requireOfficer } from "@/lib/auth/dal";
import { formatManilaTime } from "@/lib/datetime";
import { filterZones, parseZoneListFilters, zoneListHref } from "@/lib/zones/list-filters";
import { loadZoneOverview } from "@/lib/zones/overview";
import type { ZoneListFilters, ZoneMapPoint } from "@/types/zone";

function overviewSubtitle(count: number, weatherUpdatedAt: Date | null): string {
  const zones = `${count} ${count === 1 ? "zone" : "zones"}`;
  if (count === 0) return zones;
  return `${zones} · ${weatherUpdatedAt ? `Weather updated ${formatManilaTime(weatherUpdatedAt)}` : "Weather unavailable"}`;
}

/**
 * The zone list below the map: search, status filter, and Card / List view
 * toggle, then the matching zones (or an empty state with Clear filters).
 */
function ZoneList({ zones, filters }: { zones: ZoneMapPoint[]; filters: ZoneListFilters }) {
  const shown = filterZones(zones, filters);

  return (
    <section aria-label="Zone list" className="mt-4 overflow-hidden rounded-xl border bg-card">
      <TableToolbar>
        <SearchField
          action="/zones"
          label="Search zones"
          placeholder="Search zone name…"
          defaultValue={filters.q}
          keep={{ status: filters.status, view: filters.view === "card" ? null : filters.view }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <ZoneStatusFilter filters={filters} />
          <ViewToggle
            label="Zone view"
            view={filters.view}
            hrefs={{ card: zoneListHref({ ...filters, view: "card" }), list: zoneListHref({ ...filters, view: "list" }) }}
          />
        </div>
      </TableToolbar>
      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <SearchX className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No zones match these filters.</p>
          <Link
            href={zoneListHref({ q: "", status: null, view: filters.view })}
            scroll={false}
            className="inline-flex min-h-11 items-center text-xs font-bold text-link hover:text-primary-hover"
          >
            Clear filters
          </Link>
        </div>
      ) : filters.view === "list" ? (
        <ZoneTable zones={shown} showCoordinates />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 p-4">
          {shown.map((zone) => (
            <li key={zone.id} className="grid">
              <ZoneCard zone={zone} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface ZonesOverviewProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The zones page body: the map card and the Current conditions card for every
 * zone, then the filterable zone list. Loads the weather once for all of them.
 * Render inside `<Suspense>`.
 */
export async function ZonesOverview({ searchParams }: ZonesOverviewProps) {
  const filters = parseZoneListFilters(await searchParams);
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
        <ZoneList zones={zones} filters={filters} />
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
      <div className="mt-4 overflow-hidden rounded-xl border bg-card">
        <div className="h-[65px] border-b" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[165px] rounded-[11px]" />
          ))}
        </div>
      </div>
    </>
  );
}
