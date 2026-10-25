"use client";

import "leaflet/dist/leaflet.css";
import "./leaflet-global";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import L from "leaflet";
import { useEffect, useEffectEvent } from "react";
import { CircleMarker, MapContainer, Polygon, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { BarangayFocus } from "@/components/zones/barangay-focus";
import { useRemountKey } from "@/hooks/use-remount-key";
import { MI_ISI_BOUNDS, OSM_ATTRIBUTION, OSM_TILE_URL } from "@/lib/map";
import type { ZoneColor } from "@/lib/zone-colors";

/** What a tap on the picker does: set the center, add a boundary corner, or nothing while corners are dragged. */
export type BoundaryMode = "pick" | "draw" | "edit";

export interface ZoneLocationPickerProps {
  /** The current center, or `null` when the inputs don't hold a valid pair. */
  point: [number, number] | null;
  /** Called with the tapped coordinates. */
  onPick: (latitude: number, longitude: number) => void;
  /** The drawn boundary's `[lat, lng]` corners, or `null` when there is none. */
  corners: [number, number][] | null;
  color: ZoneColor;
  mode: BoundaryMode;
  /** Called with the new corners and the shape's center after drawing it or moving a corner. */
  onBoundaryChange: (corners: [number, number][], center: [number, number]) => void;
}

type BoundaryProps = Pick<ZoneLocationPickerProps, "corners" | "color" | "onBoundaryChange">;

// No snapping: it pulls corners onto the barangay's edge, where the inside-Mi-isi check rejects them.
const GEOMAN_OPTIONS = { allowSelfIntersection: false, snappable: false };

const round = (value: number) => Number(value.toFixed(6));

/** The polygon's corners and center, rounded like a picked point. */
function readShape(layer: L.Polygon): [[number, number][], [number, number]] {
  const corners = (layer.getLatLngs()[0] as L.LatLng[]).map((latLng): [number, number] => {
    const { lat, lng } = latLng.wrap();
    return [round(lat), round(lng)];
  });
  const center = layer.getCenter();
  return [corners, [round(center.lat), round(center.lng)]];
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

/** Geoman's polygon tool: each tap adds a corner, tapping the first corner finishes the shape. */
function DrawBoundary({ onBoundaryChange }: Pick<BoundaryProps, "onBoundaryChange">) {
  const map = useMap();
  const onCreate = useEffectEvent(({ layer }: { layer: L.Layer }) => {
    // The shape lives in the form's state; the picker draws it from there.
    const [corners, center] = readShape(layer as L.Polygon);
    layer.remove();
    onBoundaryChange(corners, center);
  });

  useEffect(() => {
    map.pm.enableDraw("Polygon", GEOMAN_OPTIONS);
    map.on("pm:create", onCreate);
    return () => {
      map.off("pm:create", onCreate);
      map.pm.disableDraw();
    };
  }, [map]);

  return null;
}

/** The boundary with draggable corners. Built by hand, so react-leaflet never resets corners Geoman is moving. */
function EditBoundary({ corners, color, onBoundaryChange }: BoundaryProps) {
  const map = useMap();
  const startShape = useEffectEvent(() => L.polygon(corners ?? [], { className: `zone-area zone-area--${color}` }));
  const onEdit = useEffectEvent(({ layer }: { layer: L.Layer }) => {
    const [next, center] = readShape(layer as L.Polygon);
    onBoundaryChange(next, center);
  });

  useEffect(() => {
    const layer = startShape().addTo(map);
    layer.pm.enable(GEOMAN_OPTIONS);
    layer.on("pm:edit", onEdit);
    return () => {
      layer.off("pm:edit", onEdit);
      layer.pm.disable();
      layer.remove();
    };
  }, [map]);

  return null;
}

/**
 * A small map of Barangay Mi-isi that marks the zone's center and boundary. In
 * `pick` mode a tap sets the center; in `draw` mode taps trace a new boundary;
 * in `edit` mode the boundary's corners can be dragged. Browser-only: load it
 * through `next/dynamic` with `ssr: false`.
 */
export default function ZoneLocationPicker({
  point,
  onPick,
  corners,
  color,
  mode,
  onBoundaryChange,
}: ZoneLocationPickerProps) {
  const mapKey = useRemountKey();

  return (
    <MapContainer
      key={mapKey}
      {...(point ? { center: point, zoom: 15 } : { bounds: MI_ISI_BOUNDS })}
      maxBoundsViscosity={1}
      scrollWheelZoom={false}
      className="h-[280px] rounded-xl"
    >
      <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
      <BarangayFocus />
      {corners && mode !== "edit" && (
        // Not interactive, so a tap inside the area still reaches the map and sets the center.
        <Polygon key={color} positions={corners} interactive={false} className={`zone-area zone-area--${color}`} />
      )}
      {point && (
        <CircleMarker
          center={point}
          radius={10}
          pathOptions={{ color: "#1f6b3a", fillColor: "#1f6b3a", fillOpacity: 0.7, weight: 2 }}
        />
      )}
      {mode === "pick" && <PickOnClick onPick={onPick} />}
      {mode === "draw" && <DrawBoundary onBoundaryChange={onBoundaryChange} />}
      {mode === "edit" && <EditBoundary corners={corners} color={color} onBoundaryChange={onBoundaryChange} />}
      <FollowPoint point={point} />
    </MapContainer>
  );
}
