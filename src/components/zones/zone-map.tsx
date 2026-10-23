"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

import { SeverityBadge } from "@/components/alerts/severity-badge";
import { RainfallBadge } from "@/components/weather/rainfall-badge";
import { useRemountKey } from "@/hooks/use-remount-key";
import { SEVERITIES } from "@/lib/domain/hazards";
import { FALLBACK_CENTER, FALLBACK_ZOOM, OSM_ATTRIBUTION, OSM_TILE_URL } from "@/lib/map";
import type { ZoneMapPoint } from "@/types/zone";

/** Marker color for a zone with no active alert. */
const CLEAR_COLOR = "#9ca3af";

interface ZoneMapProps {
  zones: ZoneMapPoint[];
}

/** Zooms the map to show every zone; leaves the fallback view when there are none. */
function FitBounds({ zones }: ZoneMapProps) {
  const map = useMap();

  useEffect(() => {
    if (zones.length === 0) return;
    map.fitBounds(
      zones.map((zone) => [zone.latitude, zone.longitude]),
      // maxZoom keeps a single zone from zooming in to street level. No animation: Leaflet 1.9
      // crashes (`_leaflet_pos`) if the map is removed mid-zoom, e.g. by navigating right away.
      { padding: [32, 32], maxZoom: 15, animate: false },
    );
  }, [map, zones]);

  return null;
}

function ZonePopup({ zone }: { zone: ZoneMapPoint }) {
  return (
    <div className="flex min-w-44 flex-col gap-2 text-sm">
      <span className="text-base font-semibold">{zone.name}</span>
      {zone.worstSeverity ? <SeverityBadge severity={zone.worstSeverity} /> : <span>Clear</span>}
      {zone.activeAlertTitles.length > 0 && (
        <ul className="flex list-disc flex-col gap-0.5 pl-4">
          {zone.activeAlertTitles.map((title, i) => (
            <li key={i}>{title}</li>
          ))}
        </ul>
      )}
      <span>
        {zone.memberCount} active {zone.memberCount === 1 ? "member" : "members"}
      </span>
      {zone.rainfallLevel ? (
        <RainfallBadge level={zone.rainfallLevel} />
      ) : (
        <span className="text-muted-foreground">Weather unavailable</span>
      )}
    </div>
  );
}

/**
 * Every zone as a circle colored by its worst active alert (gray when clear), on
 * OpenStreetMap tiles. Browser-only: load it through {@link ZoneMapClient}.
 */
export default function ZoneMap({ zones }: ZoneMapProps) {
  const mapKey = useRemountKey();

  return (
    <MapContainer
      key={mapKey}
      center={FALLBACK_CENTER}
      zoom={FALLBACK_ZOOM}
      scrollWheelZoom={false}
      className="h-[280px] rounded-xl md:h-[360px]"
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      {zones.map((zone) => {
        const color = zone.worstSeverity ? SEVERITIES[zone.worstSeverity].color : CLEAR_COLOR;
        return (
          <CircleMarker
            key={zone.id}
            center={[zone.latitude, zone.longitude]}
            radius={12}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 2 }}
          >
            <Popup>
              <ZonePopup zone={zone} />
            </Popup>
          </CircleMarker>
        );
      })}
      <FitBounds zones={zones} />
    </MapContainer>
  );
}
