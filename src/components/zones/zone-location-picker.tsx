"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { useRemountKey } from "@/hooks/use-remount-key";
import { FALLBACK_CENTER, FALLBACK_ZOOM, OSM_ATTRIBUTION, OSM_TILE_URL } from "@/lib/map";

export interface ZoneLocationPickerProps {
  /** The current center, or `null` when the inputs don't hold a valid pair. */
  point: [number, number] | null;
  /** Called with the tapped coordinates. */
  onPick: (latitude: number, longitude: number) => void;
}

function PickOnClick({ onPick }: Pick<ZoneLocationPickerProps, "onPick">) {
  useMapEvents({
    click(event) {
      // wrap() keeps the longitude within ±180 if the map was panned around the globe.
      const { lat, lng } = event.latlng.wrap();
      onPick(lat, lng);
    },
  });
  return null;
}

/** Pans to the point when it was typed in somewhere outside the visible area. */
function FollowPoint({ point }: Pick<ZoneLocationPickerProps, "point">) {
  const map = useMap();
  const [lat, lng] = point ?? [null, null];

  useEffect(() => {
    if (lat === null || lng === null) return;
    if (!map.getBounds().contains([lat, lng])) map.panTo([lat, lng]);
  }, [map, lat, lng]);

  return null;
}

/**
 * A small map that reports where it was tapped and marks the current point.
 * Browser-only: load it through `next/dynamic` with `ssr: false`.
 */
export default function ZoneLocationPicker({ point, onPick }: ZoneLocationPickerProps) {
  const mapKey = useRemountKey();

  return (
    <MapContainer
      key={mapKey}
      center={point ?? FALLBACK_CENTER}
      zoom={point ? 15 : FALLBACK_ZOOM}
      scrollWheelZoom={false}
      className="h-[280px] rounded-xl"
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      {point && (
        <CircleMarker
          center={point}
          radius={10}
          pathOptions={{ color: "#1f6b3a", fillColor: "#1f6b3a", fillOpacity: 0.7, weight: 2 }}
        />
      )}
      <PickOnClick onPick={onPick} />
      <FollowPoint point={point} />
    </MapContainer>
  );
}
