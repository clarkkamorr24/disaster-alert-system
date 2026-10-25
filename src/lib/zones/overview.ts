import "server-only";

import { prisma } from "@/lib/db";
import { computeZoneStatuses } from "@/lib/domain/zone-status";
import { describeWeatherCode, forecastTimeToDate, getZoneWeather } from "@/lib/weather/open-meteo";
import type { ZoneWeather } from "@/types/weather";
import { toZoneColor } from "@/lib/zone-colors";
import type { ZoneBoundary, ZoneMapPoint } from "@/types/zone";

/** Every zone with its status and weather, as the dashboard and the zones page show them. */
export interface ZoneOverviewData {
  /** Ordered by name. */
  zones: ZoneMapPoint[];
  /** The full weather by zone id, `null` where unavailable. */
  weather: Record<string, ZoneWeather | null>;
  /** The oldest weather reading, `null` when none came back. */
  weatherUpdatedAt: Date | null;
}

/**
 * Loads every zone with its active member count, worst active alert, and weather
 * (one Open-Meteo request for all zones).
 *
 * @returns The zones as map points, their weather, and when it was read.
 */
export async function loadZoneOverview(): Promise<ZoneOverviewData> {
  const [zones, alerts] = await Promise.all([
    prisma.farmZone.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        boundary: true,
        color: true,
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

  // Open-Meteo times are fixed-length local timestamps, so they sort as strings.
  const oldestFetchedAt = Object.values(weather)
    .flatMap((entry) => (entry ? [entry.fetchedAt] : []))
    .sort()[0];

  return {
    weather,
    weatherUpdatedAt: oldestFetchedAt ? forecastTimeToDate(oldestFetchedAt) : null,
    zones: zones.map((zone, i) => {
      const current = weather[zone.id] ?? null;
      return {
        id: zone.id,
        name: zone.name,
        latitude: zone.latitude,
        longitude: zone.longitude,
        // Written only through zoneInputSchema, so a stored boundary is always a valid ZoneBoundary.
        boundary: zone.boundary as ZoneBoundary | null,
        color: toZoneColor(zone.color),
        worstSeverity: statuses[i].worstSeverity,
        activeAlertTitles: statuses[i].activeAlertIds.map((id) => titleById.get(id) ?? ""),
        memberCount: zone._count.members,
        rainfallLevel: current?.rainfallLevel ?? null,
        weatherCode: current?.weatherCode ?? null,
        maxRainNext24h: current?.maxRainNext24h ?? null,
        condition: current ? describeWeatherCode(current.weatherCode) : null,
      };
    }),
  };
}
