"use client";

import L from "leaflet";
import { useEffect } from "react";
import { Polygon, useMap } from "react-leaflet";

import { MI_ISI_BOUNDS } from "@/lib/map";
import { MI_ISI_BOUNDARY } from "@/lib/mi-isi-boundary";

const WORLD: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

/**
 * Keeps a map on Barangay Mi-isi: dims everything outside the boundary, outlines it,
 * and stops panning or zooming out past it. Render inside a `MapContainer` that has
 * `maxBoundsViscosity={1}`.
 */
export function BarangayFocus() {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(MI_ISI_BOUNDS);
    map.setMaxBounds(bounds.pad(0.15));
    map.setMinZoom(map.getBoundsZoom(bounds));
  }, [map]);

  return (
    <>
      {/* Leaflet options as props: react-leaflet applies `pathOptions` with setStyle, which ignores className and interactive. */}
      <Polygon positions={[WORLD, ...MI_ISI_BOUNDARY]} stroke={false} interactive={false} className="barangay-mask" />
      <Polygon
        positions={MI_ISI_BOUNDARY.map((ring) => [ring])}
        fill={false}
        interactive={false}
        className="barangay-outline"
      />
    </>
  );
}
