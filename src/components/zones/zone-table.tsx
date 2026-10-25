import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

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
  /**
   * The dashboard's columns: an active alert count, weather and rainfall in one
   * cell, and no chevron column.
   */
  compact?: boolean;
}

function Weather({ zone }: { zone: ZoneMapPoint }) {
  if (zone.weatherCode === null) return "Weather unavailable";
  return (
    <span className="flex items-center gap-[7px] text-[#58675e] dark:text-table-foreground">
      <WeatherIcon code={zone.weatherCode} />
      {zone.condition}
    </span>
  );
}

/** Zones as table rows (name, members, status, weather, rainfall), each row linking to its zone. */
export function ZoneTable({ zones, showCoordinates = false, compact = false }: ZoneTableProps) {
  return (
    <Table className={cn("text-[13px]", compact ? "min-w-[600px]" : "min-w-[680px]")}>
      <TableHeader>
        <TableRow>
          <TableHead className="px-[18px]">Farm zone</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Status</TableHead>
          {compact ? (
            <>
              <TableHead>Active alerts</TableHead>
              <TableHead>Weather · rain next 24 h</TableHead>
            </>
          ) : (
            <>
              <TableHead>Current weather</TableHead>
              <TableHead>Rainfall (next 24 h)</TableHead>
              <TableHead>
                <span className="sr-only">Open</span>
              </TableHead>
            </>
          )}
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
            {compact ? (
              <>
                <TableCell className="tabular-nums">{zone.activeAlertTitles.length || "—"}</TableCell>
                <TableCell>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <Weather zone={zone} />
                    {zone.weatherCode !== null && <Rainfall zone={zone} />}
                  </span>
                </TableCell>
              </>
            ) : (
              <>
                <TableCell>
                  <Weather zone={zone} />
                </TableCell>
                <TableCell>
                  <Rainfall zone={zone} />
                </TableCell>
                <TableCell>
                  <ChevronRight className="ml-auto size-4 text-[#96a198]" aria-hidden="true" />
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
