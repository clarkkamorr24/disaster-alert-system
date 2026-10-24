import { CloudOff, CloudSun, Droplets, Info } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { RainfallBadge } from "@/components/weather/rainfall-badge";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { formatManilaDateTime } from "@/lib/datetime";
import { describeWeatherCode, forecastTimeToDate, getZoneWeather } from "@/lib/weather/open-meteo";

interface WeatherCardProps {
  zone: { id: string; latitude: number; longitude: number };
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="zone-weather-heading"
      className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-accent-border bg-accent"
    >
      {children}
    </section>
  );
}

function Heading() {
  return (
    <h2 id="zone-weather-heading" className="text-[10px] font-bold tracking-[.08em] text-accent-muted-foreground uppercase">
      Weather
    </h2>
  );
}

function Cell({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-[15px] text-accent-muted-foreground">
      {icon}
      <span className="flex flex-col text-[10px]">
        {label}
        <strong className="mt-0.5 text-xs text-foreground tabular-nums">{value}</strong>
      </span>
    </div>
  );
}

/**
 * Current weather and the heaviest rain in the next 24 hours at a zone's center,
 * styled like the zones page's Current conditions card but light. Render inside `<Suspense>`.
 */
export async function WeatherCard({ zone }: WeatherCardProps) {
  const weather = (await getZoneWeather([zone]))[zone.id];

  if (!weather) {
    return (
      <Shell>
        <div className="flex flex-col gap-3 p-6">
          <Heading />
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CloudOff className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            Weather unavailable
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="bg-(image:--conditions-glow) p-6">
        <Heading />
        <div className="mt-[18px] mb-1 flex items-center gap-[13px] text-primary">
          <WeatherIcon code={weather.weatherCode} className="size-[38px]" />
          <strong className="font-heading text-[38px] leading-none font-bold text-foreground tabular-nums">
            {Math.round(weather.tempC)}°
          </strong>
        </div>
        <p className="text-xs text-muted-foreground">
          {describeWeatherCode(weather.weatherCode)} · wind {Math.round(weather.windKmh)} km/h
        </p>
      </div>
      <div className="grid grid-cols-2 border-y border-accent-border">
        <div className="border-r border-accent-border">
          <Cell
            icon={<Droplets className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
            label="Rainfall now"
            value={`${weather.precipMm.toFixed(1)} mm`}
          />
        </div>
        <Cell
          icon={<CloudSun className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
          label="Next 24h"
          value={`${weather.maxRainNext24h.toFixed(1)} mm/h max`}
        />
      </div>
      <div className="flex flex-col gap-3 p-[15px]">
        <RainfallBadge level={weather.rainfallLevel} className="bg-card text-xs" />
        <p className="flex items-start gap-2 text-[11px] leading-[1.45] text-muted-foreground">
          <Info className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>
            Updated {formatManilaDateTime(forecastTimeToDate(weather.fetchedAt))}. Weather is advisory: log an
            alert if action is needed.
          </span>
        </p>
      </div>
    </Shell>
  );
}

/** Placeholder while {@link WeatherCard} loads. */
export function WeatherCardSkeleton() {
  return <Skeleton className="h-[330px] rounded-xl" />;
}
