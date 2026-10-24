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
import { severityTone } from "@/lib/domain/status-tone";
import { loadZoneOverview } from "@/lib/zones/overview";
import type { ZoneMapPoint } from "@/types/zone";

function WeatherUpdated({ at }: { at: Date | null }) {
  const Icon = at ? CloudSun : CloudOff;
  return (
    <span className="flex min-h-11 items-center gap-1.5 text-[11px] text-[#75827a] dark:text-muted-foreground">
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

function ZoneTable({ zones }: { zones: ZoneMapPoint[] }) {
  return (
    <Table className="min-w-[620px]">
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
            <TableCell className="h-[54px] px-[18px] font-semibold text-foreground">
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
              <StatusPill tone={severityTone(zone.worstSeverity)}>
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
 * "Zone monitoring": the zone map colored by each zone's worst active alert, above
 * a table of members, status, and weather. Awaits the weather, so render it inside `<Suspense>`.
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
        <ZoneMapClient zones={zones} className="h-[275px] border-b" />
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
        <Skeleton className="h-[275px] rounded-none border-b" />
        <Skeleton className="h-[39px] rounded-none" />
        <div className="h-[162px]" />
      </div>
    </div>
  );
}
