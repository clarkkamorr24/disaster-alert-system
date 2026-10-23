import { CloudOff } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RainfallBadge } from "@/components/weather/rainfall-badge";
import { formatManilaDateTime } from "@/lib/datetime";
import { describeWeatherCode, forecastTimeToDate, getZoneWeather } from "@/lib/weather/open-meteo";

interface WeatherCardProps {
  zone: { id: string; latitude: number; longitude: number };
}

function WeatherCardHeader({ children }: { children?: ReactNode }) {
  return (
    <CardHeader>
      <CardTitle>
        <h2 className="text-lg font-semibold">Weather</h2>
      </CardTitle>
      {children}
    </CardHeader>
  );
}

/** Current weather and the heaviest rain in the next 24 hours at a zone's center. Render inside `<Suspense>`. */
export async function WeatherCard({ zone }: WeatherCardProps) {
  const weather = (await getZoneWeather([zone]))[zone.id];

  if (!weather) {
    return (
      <Card>
        <WeatherCardHeader />
        <CardContent>
          <p className="flex items-center gap-2 text-muted-foreground">
            <CloudOff className="size-4 shrink-0" aria-hidden="true" />
            Weather unavailable
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <WeatherCardHeader>
        <CardDescription>Updated {formatManilaDateTime(forecastTimeToDate(weather.fetchedAt))}</CardDescription>
      </WeatherCardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <div>
            <dt className="text-sm text-muted-foreground">Temperature</dt>
            <dd className="text-lg font-medium tabular-nums">{weather.tempC.toFixed(1)} °C</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Condition</dt>
            <dd className="text-lg font-medium">{describeWeatherCode(weather.weatherCode)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Wind</dt>
            <dd className="text-lg font-medium tabular-nums">{weather.windKmh.toFixed(1)} km/h</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Rain now</dt>
            <dd className="text-lg font-medium tabular-nums">{weather.precipMm.toFixed(1)} mm</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">Heaviest rain next 24 h: {weather.maxRainNext24h.toFixed(1)} mm/h</p>
          <RainfallBadge level={weather.rainfallLevel} />
        </div>

        <p className="text-sm text-muted-foreground">Weather is advisory. Log an alert if action is needed.</p>
      </CardContent>
    </Card>
  );
}

/** Placeholder while {@link WeatherCard} loads. */
export function WeatherCardSkeleton() {
  // Matches the loaded card: two rows of readings on phones, one row from `sm`.
  return <Skeleton className="h-83 rounded-xl sm:h-56" />;
}
