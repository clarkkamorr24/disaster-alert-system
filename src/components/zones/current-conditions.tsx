import { CloudOff, CloudSun, Droplets, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "cn";

import { WeatherIcon } from "@/components/weather/weather-icon";
import { describeWeatherCode } from "@/lib/weather/open-meteo";
import { pickConditionsZone } from "@/lib/weather/pick-zone";
import type { RainfallLevel, ZoneWeather } from "@/types/weather";

const LEVEL_LABELS: Record<Exclude<RainfallLevel, "NONE">, string> = {
  YELLOW: "Yellow",
  ORANGE: "Orange",
  RED: "Red",
};

interface CurrentConditionsProps {
  zones: { id: string; name: string }[];
  weather: Record<string, ZoneWeather | null>;
}

interface ConditionsCardProps {
  label: string;
  /** Inside the padded top area, under the label. */
  top: ReactNode;
  /** Below the top area, edge to edge. */
  children?: ReactNode;
}

function ConditionsCard({ label, top, children }: ConditionsCardProps) {
  return (
    <section
      aria-label={label}
      className="flex min-w-0 flex-[.7_1_260px] flex-col overflow-hidden rounded-xl bg-conditions text-conditions-foreground shadow-(--conditions-shadow)"
    >
      <div className="bg-(image:--conditions-glow) p-6">
        <span className="text-[10px] font-bold tracking-[.08em] text-conditions-label uppercase">{label}</span>
        {top}
      </div>
      {children}
    </section>
  );
}

interface CellProps {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}

function Cell({ icon, label, value, className }: CellProps) {
  return (
    <div className={cn("flex items-center gap-2 p-[15px] text-conditions-label", className)}>
      {icon}
      <span className="flex flex-col text-[10px]">
        {label}
        <strong className="mt-0.5 text-xs text-conditions-foreground tabular-nums">{value}</strong>
      </span>
    </div>
  );
}

/**
 * The dark green weather card for the zone with the heaviest rain forecast in
 * the next 24 hours, with an advisory note from the Yellow rainfall level up.
 */
export function CurrentConditions({ zones, weather }: CurrentConditionsProps) {
  const zone = pickConditionsZone(zones, weather);
  const current = zone ? weather[zone.id] : null;

  if (!zone || !current) {
    return (
      <ConditionsCard
        label="Current conditions"
        top={
          <p className="mt-[18px] flex items-center gap-2 text-sm text-conditions-muted">
            {zones.length === 0 ? (
              "Add a zone to see weather."
            ) : (
              <>
                <CloudOff className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                Weather unavailable
              </>
            )}
          </p>
        }
      />
    );
  }

  const level = current.rainfallLevel;
  return (
    <ConditionsCard
      label={`Current conditions · ${zone.name}`}
      top={
        <>
          <div className="mt-[18px] mb-1 flex items-center gap-[13px]">
            <WeatherIcon code={current.weatherCode} className="size-[38px]" />
            <strong className="font-heading text-[38px] leading-none font-bold tabular-nums">
              {Math.round(current.tempC)}°
            </strong>
          </div>
          <p className="text-xs text-conditions-muted">
            {describeWeatherCode(current.weatherCode)} · wind {Math.round(current.windKmh)} km/h
          </p>
        </>
      }
    >
      <div className="grid grid-cols-2 border-y border-white/10">
        <Cell
          icon={<Droplets className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
          label="Rainfall now"
          value={`${current.precipMm.toFixed(1)} mm`}
          className="border-r border-white/10"
        />
        <Cell
          icon={<CloudSun className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
          label="Next 24h"
          value={`${current.maxRainNext24h.toFixed(1)} mm/h max`}
        />
      </div>
      {level !== "NONE" && (
        <p className="m-[15px] flex items-start gap-2 rounded-lg bg-status-advisory-soft p-[11px] text-[11px] leading-[1.45] text-status-advisory">
          <Info className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>
            {LEVEL_LABELS[level]} rainfall level forecast for {zone.name}. Reference only, not an official
            warning.
          </span>
        </p>
      )}
    </ConditionsCard>
  );
}
