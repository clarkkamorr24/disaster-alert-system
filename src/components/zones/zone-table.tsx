import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { StatusPill } from "@/components/layout/status-pill";
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
import { formatCoordinates } from "@/lib/domain/coordinates";
import { SEVERITIES } from "@/lib/domain/hazards";
import { isCriticalActive, severityTone } from "@/lib/domain/status-tone";
import type { ZoneMapPoint } from "@/types/zone";

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

interface ZoneTableProps {
  zones: ZoneMapPoint[];
  /** Shows each zone's coordinates under its name, as the zone cards do. */
  showCoordinates?: boolean;
}

/** Zones as table rows (name, members, status, weather, rainfall), each row linking to its zone. */
export function ZoneTable({ zones, showCoordinates = false }: ZoneTableProps) {
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
              {showCoordinates && (
                <span className="block text-[13px] font-normal text-subtle-foreground tabular-nums">
                  {formatCoordinates(zone.latitude, zone.longitude)}
                </span>
              )}
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
