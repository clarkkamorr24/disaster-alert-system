"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";
import { AttributionControl, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { cn } from "cn";

import { SeverityBadge } from "@/components/alerts/severity-badge";
import { RainfallBadge } from "@/components/weather/rainfall-badge";
import type { Severity } from "@/generated/prisma/enums";
import { useRemountKey } from "@/hooks/use-remount-key";
import { severityTone, type SeverityTone } from "@/lib/domain/status-tone";
import { FALLBACK_CENTER, FALLBACK_ZOOM, OSM_ATTRIBUTION, OSM_TILE_URL } from "@/lib/map";
import type { ZoneMapPoint } from "@/types/zone";

const LEGEND: { severity: Severity | null; label: string; always: boolean }[] = [
  { severity: "CRITICAL", label: "Critical", always: true },
  { severity: "HIGH", label: "High", always: false },
  { severity: "MODERATE", label: "Moderate", always: true },
  { severity: "LOW", label: "Low", always: false },
  { severity: null, label: "Clear", always: true },
];

const LEGEND_DOT_CLASS: Record<SeverityTone, string> = {
  critical: "bg-marker-critical",
  high: "bg-marker-high",
  moderate: "bg-marker-moderate",
  low: "bg-marker-low",
  clear: "bg-marker-clear",
};

const pinIcons = new Map<SeverityTone, L.DivIcon>();

/** The teardrop pin for a tone (styled in `globals.css`), created once per tone. */
function pinIcon(tone: SeverityTone): L.DivIcon {
  let icon = pinIcons.get(tone);
  if (!icon) {
    icon = L.divIcon({
      className: `zone-pin zone-pin--${tone}`,
      iconSize: [17, 17],
      // The rotated square's tip sits about 12px below its center.
      iconAnchor: [8.5, 20.5],
      popupAnchor: [0, -22],
      // Leaflet adds a 6px margin to right-hand tooltips.
      tooltipAnchor: [9, -12],
    });
    pinIcons.set(tone, icon);
  }
  return icon;
}

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
      { padding: [40, 40], maxZoom: 15, animate: false },
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

/** What the pin colors mean: Critical, Moderate, and Clear, plus High and Low when a zone has them. */
function MapLegend({ zones }: ZoneMapProps) {
  const items = LEGEND.filter(
    (item) => item.always || zones.some((zone) => zone.worstSeverity === item.severity),
  );
  return (
    <ul
      aria-label="Map legend"
      className="absolute right-[13px] bottom-3 z-[500] flex flex-wrap gap-x-[13px] gap-y-1 rounded-[7px] border border-[#dfe6e1] bg-white/94 px-[11px] py-2 text-[10px] text-[#627067] max-sm:bottom-8"
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-[5px]">
          <span
            aria-hidden="true"
            className={cn("size-[7px] rounded-full", LEGEND_DOT_CLASS[severityTone(item.severity)])}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Every zone as a pin colored by its worst active alert (gray when clear), with
 * its name and a legend, on muted OpenStreetMap tiles. Fills its parent, which
 * must be `relative`. Browser-only: load it through {@link ZoneMapClient}.
 */
export default function ZoneMap({ zones }: ZoneMapProps) {
  const mapKey = useRemountKey();

  return (
    <>
      <MapContainer
        key={mapKey}
        center={FALLBACK_CENTER}
        zoom={FALLBACK_ZOOM}
        scrollWheelZoom={false}
        attributionControl={false}
        className="zone-map size-full"
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <AttributionControl position="bottomleft" />
        {zones.map((zone) => (
          <Marker
            key={zone.id}
            position={[zone.latitude, zone.longitude]}
            icon={pinIcon(severityTone(zone.worstSeverity))}
            title={zone.name}
          >
            <Tooltip permanent direction="right" className="zone-pin-label">
              {zone.name}
            </Tooltip>
            <Popup>
              <ZonePopup zone={zone} />
            </Popup>
          </Marker>
        ))}
        <FitBounds zones={zones} />
      </MapContainer>
      <MapLegend zones={zones} />
    </>
  );
}
