"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapPin } from "lucide-react";
import { useRef, useState } from "react";
import { AttributionControl, MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip } from "react-leaflet";
import { cn } from "cn";

import { SeverityBadge } from "@/components/alerts/severity-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RainfallBadge } from "@/components/weather/rainfall-badge";
import { BarangayFocus } from "@/components/zones/barangay-focus";
import type { Severity } from "@/generated/prisma/enums";
import { useRemountKey } from "@/hooks/use-remount-key";
import { severityTone, type SeverityTone } from "@/lib/domain/status-tone";
import { boundaryToLatLngs, MI_ISI_BOUNDS, OSM_ATTRIBUTION, OSM_TILE_URL } from "@/lib/map";
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

const pinIcons = new Map<string, L.DivIcon>();

/** The teardrop pin for a tone (styled in `globals.css`), larger and ringed when selected; created once each. */
function pinIcon(tone: SeverityTone, selected: boolean): L.DivIcon {
  const key = `${tone}:${selected}`;
  let icon = pinIcons.get(key);
  if (!icon) {
    // The rotated square's tip sits about 0.7 × its size below its center.
    const size = selected ? 25 : 17;
    const half = size / 2;
    const tip = half + size * 0.707;
    icon = L.divIcon({
      className: cn("zone-pin", `zone-pin--${tone}`, selected && "zone-pin--selected"),
      iconSize: [size, size],
      iconAnchor: [half, tip],
      popupAnchor: [0, -tip - 1],
      // Leaflet adds a 6px margin to right-hand tooltips.
      tooltipAnchor: [half, -tip / 2 - 2],
    });
    pinIcons.set(key, icon);
  }
  return icon;
}

interface ZoneMapProps {
  zones: ZoneMapPoint[];
}

interface ZonePickerProps extends ZoneMapProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** The "Show zone" select over the map: a zone zooms to its pin, All zones shows the whole barangay. */
function ZonePicker({ zones, selectedId, onSelect }: ZonePickerProps) {
  const items = [{ value: null, label: "All zones" }, ...zones.map((zone) => ({ value: zone.id, label: zone.name }))];

  return (
    <div className="absolute top-3 right-[13px] z-[500]">
      <Select items={items} value={selectedId} onValueChange={(value) => onSelect(value as string | null)}>
        <SelectTrigger
          aria-label="Show zone"
          className="h-11 max-w-48 gap-[7px] rounded-lg border-input bg-card px-3 text-xs font-semibold text-control-foreground shadow-sm data-[size=default]:h-11 sm:h-[34px] sm:data-[size=default]:h-[34px]"
        >
          <MapPin className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value ?? "all"} value={item.value} className="min-h-11 sm:min-h-9">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
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
 * Barangay Mi-isi with every zone as a pin colored by its worst active alert
 * (gray when clear), its name, a legend, and a zone picker, on muted
 * OpenStreetMap tiles. Zones with a drawn boundary also show their area in
 * their own color under the pin. Choosing a zone or tapping its pin or area
 * highlights the pin and opens its details. Fills its parent, which must be `relative`.
 * Browser-only: load it through {@link ZoneMapClient}.
 */
export default function ZoneMap({ zones }: ZoneMapProps) {
  const mapKey = useRemountKey();
  const [map, setMap] = useState<L.Map | null>(null);
  // Follows the open popup, so tapping a pin and closing its popup keep the picker in sync.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const markers = useRef(new Map<string, L.Marker>());

  function select(id: string | null) {
    if (!map) return;
    const zone = zones.find((z) => z.id === id);
    if (!zone) {
      map.closePopup();
      // No animation: Leaflet 1.9 crashes (`_leaflet_pos`) if the map is removed mid-zoom.
      map.fitBounds(MI_ISI_BOUNDS, { animate: false });
      return;
    }
    map.setView([zone.latitude, zone.longitude], Math.max(map.getZoom(), 16), { animate: false });
    markers.current.get(zone.id)?.openPopup();
  }

  return (
    <>
      <MapContainer
        key={mapKey}
        ref={setMap}
        bounds={MI_ISI_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom={false}
        attributionControl={false}
        className="zone-map size-full"
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        <AttributionControl position="bottomleft" />
        <BarangayFocus />
        {zones.map(
          (zone) =>
            zone.boundary && (
              // Keyed by color: react-leaflet applies className only when the path is created.
              <Polygon
                key={`${zone.id}:${zone.color}`}
                positions={boundaryToLatLngs(zone.boundary)}
                className={`zone-area zone-area--${zone.color}`}
                eventHandlers={{ click: () => markers.current.get(zone.id)?.openPopup() }}
              />
            ),
        )}
        {zones.map((zone) => {
          const selected = zone.id === selectedId;
          return (
            <Marker
              key={zone.id}
              ref={(marker) => {
                if (marker) markers.current.set(zone.id, marker);
                else markers.current.delete(zone.id);
              }}
              position={[zone.latitude, zone.longitude]}
              icon={pinIcon(severityTone(zone.worstSeverity), selected)}
              zIndexOffset={selected ? 1000 : 0}
              title={zone.name}
              eventHandlers={{
                popupopen: () => setSelectedId(zone.id),
                popupclose: () => setSelectedId((current) => (current === zone.id ? null : current)),
              }}
            >
              <Tooltip permanent direction="right" className="zone-pin-label">
                {zone.name}
              </Tooltip>
              <Popup>
                <ZonePopup zone={zone} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {zones.length > 0 && <ZonePicker zones={zones} selectedId={selectedId} onSelect={select} />}
      <MapLegend zones={zones} />
    </>
  );
}
