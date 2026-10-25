import { ChevronRight, CircleCheck, CloudOff, CloudSun } from "lucide-react";
import Link from "next/link";

import { SectionHeader, SectionHeaderSkeleton } from "@/components/dashboard/section-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { ZoneMapClient } from "@/components/zones/zone-map-client";
import { ZoneTable } from "@/components/zones/zone-table";
import { requireOfficer } from "@/lib/auth/dal";
import { formatManilaTime } from "@/lib/datetime";
import { SEVERITIES } from "@/lib/domain/hazards";
import { isCriticalActive, severityTone } from "@/lib/domain/status-tone";
import { ATTENTION_LIMIT, selectAttentionZones } from "@/lib/zones/attention";
import { zoneListHref } from "@/lib/zones/list-filters";
import { loadZoneOverview } from "@/lib/zones/overview";
import type { Severity } from "@/generated/prisma/enums";
import type { ZoneMapPoint } from "@/types/zone";

/** Worst first, so the zones that need attention lead the summary. */
const SUMMARY_ORDER: (Severity | null)[] = ["CRITICAL", "HIGH", "MODERATE", "LOW", null];

/** Map height: the map is the dashboard's main view. */
const MAP_HEIGHT = "h-[320px] sm:h-[420px] lg:h-[480px]";

function WeatherUpdated({ at }: { at: Date | null }) {
  const Icon = at ? CloudSun : CloudOff;
  return (
    <span className="flex min-h-11 items-center gap-1.5 text-[13px] text-[#75827a] dark:text-muted-foreground">
      <Icon className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
      {at ? `Weather updated ${formatManilaTime(at)}` : "Weather unavailable"}
    </span>
  );
}

/** Same style as the section headers' View all links. */
const VIEW_LINK_CLASS =
  "inline-flex min-h-11 items-center gap-[3px] px-0.5 text-xs font-bold text-link hover:text-primary-hover";

/**
 * How many zones are at each status, worst first, leaving out statuses no zone has,
 * each opening `/zones` filtered to it, with a link to the active alerts on the right.
 */
function StatusSummary({ zones }: { zones: ZoneMapPoint[] }) {
  const counts = SUMMARY_ORDER.map((severity) => ({
    severity,
    count: zones.filter((zone) => zone.worstSeverity === severity).length,
  })).filter(({ count }) => count > 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-b px-[18px] py-1.5">
      <ul aria-label="Zones by status" className="flex flex-wrap gap-2">
        {counts.map(({ severity, count }) => (
          <li key={severity ?? "clear"}>
            <Link
              href={zoneListHref({ q: "", status: severity ?? "CLEAR", view: "card" })}
              className="inline-flex min-h-11 items-center rounded-full outline-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/25"
            >
              <StatusPill tone={severityTone(severity)} pulse={isCriticalActive(severity)} size="lg">
                {/* "zones", since the Active alerts card above counts alerts and one alert can cover several zones. */}
                {count} {severity ? SEVERITIES[severity].label : "Clear"} {count === 1 ? "zone" : "zones"}
              </StatusPill>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/alerts?tab=active" className={`ml-auto ${VIEW_LINK_CLASS}`}>
        View active alerts
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function allClearMessage(zones: ZoneMapPoint[]): string {
  const hasWeather = zones.some((zone) => zone.rainfallLevel !== null);
  const rain = hasWeather ? "No rainfall warnings." : "Rainfall can't be checked while weather is unavailable.";
  // Moderate and Low alerts don't make the list, so don't call those zones clear.
  if (zones.some((zone) => zone.worstSeverity)) return `No High or Critical alerts. ${rain}`;
  return `${zones.length === 1 ? "The 1 zone is" : `All ${zones.length} zones are`} clear. ${rain}`;
}

function AllClear({ zones }: { zones: ZoneMapPoint[] }) {
  return (
    <p className="flex items-center gap-2.5 px-[18px] py-5 text-sm text-foreground">
      <CircleCheck className="size-5 shrink-0 text-status-clear" strokeWidth={1.75} aria-hidden="true" />
      {allClearMessage(zones)}
    </p>
  );
}

/**
 * The zones that need attention (at most {@link ATTENTION_LIMIT}, worst first),
 * or an all-clear line, then a link to every zone.
 */
function AttentionZones({ zones }: { zones: ZoneMapPoint[] }) {
  const attention = selectAttentionZones(zones);
  const shown = attention.slice(0, ATTENTION_LIMIT);

  return (
    <>
      {attention.length === 0 ? (
        <AllClear zones={zones} />
      ) : (
        <>
          <h3 className="px-[18px] pt-3.5 pb-2.5 text-sm font-semibold text-foreground">
            Needs attention <span className="font-normal text-muted-foreground">({attention.length})</span>
          </h3>
          <ZoneTable zones={shown} compact />
        </>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 border-t px-[18px] text-[13px] text-muted-foreground">
        {attention.length > shown.length && <span>Showing the {shown.length} most urgent</span>}
        <Link href="/zones" className={`ml-auto ${VIEW_LINK_CLASS}`}>
          View all {zones.length} {zones.length === 1 ? "zone" : "zones"}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}

/**
 * "Zone monitoring", the dashboard's main section: a count of zones per status,
 * the zone map colored by each zone's worst active alert, and the zones that need
 * attention. Awaits the weather, so render it inside `<Suspense>`.
 */
export async function ZoneOverview() {
  await requireOfficer();
  const { zones, weatherUpdatedAt } = await loadZoneOverview();

  return (
    <section aria-labelledby="zones-heading">
      <SectionHeader
        id="zones-heading"
        title="Zone monitoring"
        description="Live status and weather across your farm zones"
        aside={zones.length > 0 && <WeatherUpdated at={weatherUpdatedAt} />}
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        {zones.length > 0 && <StatusSummary zones={zones} />}
        <ZoneMapClient zones={zones} className={`${MAP_HEIGHT} border-b`} />
        {zones.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No zones yet.{" "}
            <Link href="/zones/new" className="font-medium text-link hover:underline">
              Add the first zone
            </Link>
          </p>
        ) : (
          <AttentionZones zones={zones} />
        )}
      </div>
    </section>
  );
}

/** Placeholder while {@link ZoneOverview} loads. */
export function ZoneOverviewSkeleton() {
  return (
    <div>
      <SectionHeaderSkeleton />
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="h-[57px] border-b" />
        <Skeleton className={`${MAP_HEIGHT} rounded-none border-b`} />
        <div className="h-11" />
        <Skeleton className="h-[39px] rounded-none" />
        <div className="h-[180px] border-b" />
        <div className="h-11" />
      </div>
    </div>
  );
}
