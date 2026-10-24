import { Leaf, Users } from "lucide-react";
import Link from "next/link";

import { StatusPill } from "@/components/layout/status-pill";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { formatCoordinates } from "@/lib/domain/coordinates";
import { SEVERITIES } from "@/lib/domain/hazards";
import { severityTone } from "@/lib/domain/status-tone";
import type { ZoneMapPoint } from "@/types/zone";

/** One zone in the zones grid: status, name, coordinates, members, and rainfall. Links to the zone. */
export function ZoneCard({ zone }: { zone: ZoneMapPoint }) {
  return (
    <Link
      href={`/zones/${zone.id}`}
      className="flex min-h-[165px] flex-col rounded-[11px] border bg-card p-[15px] outline-none hover:border-accent-border hover:bg-row-hover focus-visible:ring-3 focus-visible:ring-ring/25"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-status-clear-soft text-status-clear">
          <Leaf className="size-[17px]" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <StatusPill tone={severityTone(zone.worstSeverity)}>
          {zone.worstSeverity ? SEVERITIES[zone.worstSeverity].label : "Clear"}
        </StatusPill>
      </div>
      <strong className="mt-3.5 font-heading text-[15px] font-bold tracking-[-0.03em] text-title-foreground">
        {zone.name}
      </strong>
      <small className="mt-0.5 mb-3.5 text-[11px] text-subtle-foreground tabular-nums">
        {formatCoordinates(zone.latitude, zone.longitude)}
      </small>
      <div className="mt-auto flex justify-between gap-2 border-t border-row-border pt-3 text-[11px] text-table-foreground">
        <span className="flex items-center gap-[5px]">
          <Users className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
          {zone.memberCount} {zone.memberCount === 1 ? "member" : "members"}
        </span>
        <span className="flex items-center gap-[5px] tabular-nums">
          {zone.weatherCode === null || zone.maxRainNext24h === null ? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Weather unavailable</span>
            </>
          ) : (
            <>
              <WeatherIcon code={zone.weatherCode} className="size-[15px]" />
              <span className="sr-only">Heaviest rain next 24 hours: </span>
              {zone.maxRainNext24h.toFixed(1)} mm/h
            </>
          )}
        </span>
      </div>
    </Link>
  );
}
