import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { SeverityBadge } from "@/components/alerts/severity-badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RainfallBadge } from "@/components/weather/rainfall-badge";
import { ZoneMapClient } from "@/components/zones/zone-map-client";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { computeZoneStatuses } from "@/lib/domain/zone-status";
import { getZoneWeather } from "@/lib/weather/open-meteo";
import type { ZoneMapPoint } from "@/types/zone";

/** Loads every zone with its member count, worst active alert, and rainfall level. */
async function loadZonePoints(): Promise<ZoneMapPoint[]> {
  const [zones, alerts] = await Promise.all([
    prisma.farmZone.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        _count: { select: { members: { where: { isActive: true } } } },
      },
    }),
    prisma.hazardAlert.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, severity: true, zones: { select: { id: true } } },
    }),
  ]);

  const statuses = computeZoneStatuses(
    zones.map((zone) => zone.id),
    alerts.map((alert) => ({ ...alert, zoneIds: alert.zones.map((zone) => zone.id) })),
  );
  const weather = await getZoneWeather(zones);
  const titleById = new Map(alerts.map((alert) => [alert.id, alert.title]));

  return zones.map((zone, i) => ({
    id: zone.id,
    name: zone.name,
    latitude: zone.latitude,
    longitude: zone.longitude,
    worstSeverity: statuses[i].worstSeverity,
    activeAlertTitles: statuses[i].activeAlertIds.map((id) => titleById.get(id) ?? ""),
    memberCount: zone._count.members,
    rainfallLevel: weather[zone.id]?.rainfallLevel ?? null,
  }));
}

function WorstSeverity({ zone }: { zone: ZoneMapPoint }) {
  return zone.worstSeverity ? (
    <SeverityBadge severity={zone.worstSeverity} />
  ) : (
    <span className="text-muted-foreground">Clear</span>
  );
}

function Rainfall({ zone }: { zone: ZoneMapPoint }) {
  return zone.rainfallLevel ? (
    <RainfallBadge level={zone.rainfallLevel} />
  ) : (
    <span className="text-sm text-muted-foreground">Weather unavailable</span>
  );
}

function ZoneTable({ zones }: { zones: ZoneMapPoint[] }) {
  return (
    <div className="hidden rounded-xl border md:block">
      <Table className="text-base">
        <TableHeader>
          <TableRow>
            <TableHead className="px-4">Zone</TableHead>
            <TableHead className="px-4 text-right">Active members</TableHead>
            <TableHead className="px-4">Worst severity</TableHead>
            <TableHead className="px-4">Rainfall (next 24 h)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {zones.map((zone) => (
            <TableRow key={zone.id}>
              <TableCell className="px-4 py-3">
                <Link href={`/zones/${zone.id}`} className="font-medium text-primary hover:underline">
                  {zone.name}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums">{zone.memberCount}</TableCell>
              <TableCell className="px-4 py-3">
                <WorstSeverity zone={zone} />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Rainfall zone={zone} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ZoneCards({ zones }: { zones: ZoneMapPoint[] }) {
  return (
    <ul className="flex flex-col gap-2 md:hidden">
      {zones.map((zone) => (
        <li key={zone.id}>
          <Link
            href={`/zones/${zone.id}`}
            className="flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:bg-muted"
          >
            <div className="flex min-w-0 flex-col gap-2">
              <span className="truncate font-medium">{zone.name}</span>
              <span className="text-sm">
                {zone.memberCount} active {zone.memberCount === 1 ? "member" : "members"}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <WorstSeverity zone={zone} />
                <Rainfall zone={zone} />
              </div>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The zone map colored by each zone's worst active alert, plus a zone table
 * with member counts and rainfall. Awaits the weather, so render it inside `<Suspense>`.
 */
export async function ZoneOverview() {
  await requireOfficer();
  const zones = await loadZonePoints();

  return (
    <section aria-labelledby="zones-heading" className="flex flex-col gap-3">
      <SectionHeader id="zones-heading" title="Zones" viewAllHref="/zones" />
      <ZoneMapClient zones={zones} />
      {zones.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          No zones yet.{" "}
          <Link href="/zones/new" className="font-medium text-primary hover:underline">
            Add the first zone
          </Link>
        </p>
      ) : (
        <>
          <ZoneTable zones={zones} />
          <ZoneCards zones={zones} />
        </>
      )}
    </section>
  );
}

/** Placeholder while {@link ZoneOverview} loads. */
export function ZoneOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-11 w-28" />
      <Skeleton className="h-[280px] rounded-xl md:h-[360px]" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
