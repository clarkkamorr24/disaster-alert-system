import { ChevronRight, CloudOff, CloudSun } from "lucide-react";
import Link from "next/link";

import { SectionHeader, SectionHeaderSkeleton } from "@/components/dashboard/section-header";
import { StatusPill } from "@/components/layout/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RAINFALL_DISPLAY } from "@/components/weather/rainfall-badge";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { ZoneMapClient } from "@/components/zones/zone-map-client";
import { requireOfficer } from "@/lib/auth/dal";
import { formatManilaTime } from "@/lib/datetime";
import { SEVERITIES } from "@/lib/domain/hazards";
import { isCriticalActive, severityTone } from "@/lib/domain/status-tone";
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

function Rainfall({ zone }: { zone: ZoneMapPoint }) {
  if (zone.maxRainNext24h === null || zone.rainfallLevel === null) return <span>—</span>;
  // A dot only for Yellow and higher, in the RainfallBadge color (an SVG fill, not an inline style).
  const { label, color } = RAINFALL_DISPLAY[zone.rainfallLevel];
  const showDot = zone.rainfallLevel !== "NONE";
  return (
    <span className="flex items-center gap-1.5 tabular-nums">
      {showDot && (
        <svg viewBox="0 0 8 8" className="size-[7px] shrink-0" aria-hidden="true">
          <circle cx="4" cy="4" r="4" fill={color} />
        </svg>
      )}
      {zone.maxRainNext24h.toFixed(1)} mm/h
      {showDot && <span className="sr-only">({label})</span>}
    </span>
  );
}

/**
 * How many zones are at each status, worst first, leaving out statuses no zone has,
 * with a link to the active alerts on the right.
 */
function StatusSummary({ zones }: { zones: ZoneMapPoint[] }) {
  const counts = SUMMARY_ORDER.map((severity) => ({
    severity,
    count: zones.filter((zone) => zone.worstSeverity === severity).length,
  })).filter(({ count }) => count > 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-b px-[18px] py-1.5">
      <ul aria-label="Zones by status" className="flex flex-wrap gap-2 py-1.5">
        {counts.map(({ severity, count }) => (
          <li key={severity ?? "clear"}>
            <StatusPill tone={severityTone(severity)} pulse={isCriticalActive(severity)} size="lg">
              {count} {severity ? SEVERITIES[severity].label : "Clear"}
            </StatusPill>
          </li>
        ))}
      </ul>
      {/* Same style as the section headers' View all links. */}
      <Link
        href="/alerts?tab=active"
        className="ml-auto inline-flex min-h-11 items-center gap-[3px] px-0.5 text-xs font-bold text-link hover:text-primary-hover"
      >
        View active alerts
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function ZoneTable({ zones }: { zones: ZoneMapPoint[] }) {
  return (
    <Table className="min-w-[680px] text-[13px]">
      <TableHeader>
        <TableRow>
          <TableHead className="px-[18px]">Farm zone</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Current weather</TableHead>
          <TableHead>Rainfall (next 24 h)</TableHead>
          <TableHead>
            <span className="sr-only">Open</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {zones.map((zone) => (
          <TableRow key={zone.id} className="relative">
            <TableCell className="h-[60px] px-[18px] text-sm font-semibold text-foreground">
              {/* The link covers the whole row, so a click anywhere on it opens the zone. */}
              <Link
                href={`/zones/${zone.id}`}
                className="outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/25 focus-visible:after:ring-inset"
              >
                {zone.name}
              </Link>
            </TableCell>
            <TableCell className="tabular-nums">{zone.memberCount}</TableCell>
            <TableCell>
              <StatusPill tone={severityTone(zone.worstSeverity)} pulse={isCriticalActive(zone.worstSeverity)} size="lg">
                {zone.worstSeverity ? SEVERITIES[zone.worstSeverity].label : "Clear"}
              </StatusPill>
            </TableCell>
            <TableCell>
              {zone.weatherCode === null ? (
                "Weather unavailable"
              ) : (
                <span className="flex items-center gap-[7px] text-[#58675e] dark:text-table-foreground">
                  <WeatherIcon code={zone.weatherCode} />
                  {zone.condition}
                </span>
              )}
            </TableCell>
            <TableCell>
              <Rainfall zone={zone} />
            </TableCell>
            <TableCell>
              <ChevronRight className="ml-auto size-4 text-[#96a198]" aria-hidden="true" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * "Zone monitoring", the dashboard's main section: a count of zones per status,
 * the zone map colored by each zone's worst active alert, and a table of members,
 * status, and weather. Awaits the weather, so render it inside `<Suspense>`.
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
          <ZoneTable zones={zones} />
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
        <Skeleton className="h-[39px] rounded-none" />
        <div className="h-[180px]" />
      </div>
    </div>
  );
}
