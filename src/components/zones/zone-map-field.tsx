"use client";

import { MapPin, Pentagon, PencilLine, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { BoundaryMode } from "@/components/zones/zone-location-picker";
import { isInMiIsi, isInRings, OUTSIDE_MI_ISI_MESSAGE } from "@/lib/map";
import type { ZoneColor } from "@/lib/zone-colors";

// Leaflet touches `window` on import, so the picker only loads in the browser.
const ZoneLocationPicker = dynamic(() => import("./zone-location-picker"), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] rounded-xl" />,
});

const HELP: Record<BoundaryMode, string> = {
  pick: "Tap the center of the zone, inside the dashed Barangay Mi-isi boundary, to fill in the coordinates. The zone's name shows there.",
  draw: "Tap each corner of the purok, then tap the first corner again to finish.",
  edit: "Drag a corner to move it, or drag a midpoint to add a corner.",
};

interface ZoneMapFieldProps {
  /** The current center, or `null` when the inputs don't hold a valid pair. */
  point: [number, number] | null;
  onCenterChange: (latitude: number, longitude: number) => void;
  /** The boundary's `[lat, lng]` corners, or `null` when none is drawn. */
  corners: [number, number][] | null;
  onCornersChange: (corners: [number, number][] | null) => void;
  color: ZoneColor;
  /** The server's message for the boundary, if it was rejected. */
  error?: string;
}

/** The zone form's map: tap to set the center, and draw, edit, or clear the purok's boundary. */
export function ZoneMapField({ point, onCenterChange, corners, onCornersChange, color, error }: ZoneMapFieldProps) {
  const [showMap, setShowMap] = useState(false);
  const [mode, setMode] = useState<BoundaryMode>("pick");
  const [pickedOutside, setPickedOutside] = useState(false);

  function pick(lat: number, lng: number) {
    // A tap outside the barangay places nothing; the save would be rejected anyway.
    const inside = isInMiIsi(lat, lng);
    setPickedOutside(!inside);
    if (inside) onCenterChange(lat, lng);
  }

  function changeBoundary(next: [number, number][], center: [number, number]) {
    onCornersChange(next);
    if (mode === "draw") setMode("pick");
    // The label sits at the center, so keep it inside the area.
    if (!point || !isInRings([next], ...point)) onCenterChange(...center);
  }

  function toggleMap() {
    setShowMap((shown) => !shown);
    setMode("pick");
  }

  return (
    <div className="flex flex-col gap-2">
      <p id="zone-boundary-status" className="text-sm text-muted-foreground">
        {corners
          ? `Boundary drawn with ${corners.length} corners.`
          : "No boundary drawn yet; the zone shows as a pin."}
      </p>
      {error && (
        <p id="zone-boundary-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        aria-expanded={showMap}
        onClick={toggleMap}
        className="h-11 self-start px-4 text-[13px]"
      >
        <MapPin data-icon="inline-start" />
        {showMap ? "Hide map" : "Set on map"}
      </Button>
      {showMap && (
        // isolate keeps Leaflet's z-indexes (400+) below the mobile sidebar sheet (z-50).
        <div className="isolate flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {mode === "pick" ? (
              <>
                <Button type="button" variant="outline" onClick={() => setMode("draw")} className="h-11 px-4 text-[13px]">
                  <Pentagon data-icon="inline-start" />
                  {corners ? "Redraw boundary" : "Draw boundary"}
                </Button>
                {corners && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMode("edit")}
                      className="h-11 px-4 text-[13px]"
                    >
                      <PencilLine data-icon="inline-start" />
                      Edit corners
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onCornersChange(null)}
                      className="h-11 px-4 text-[13px]"
                    >
                      <Trash2 data-icon="inline-start" />
                      Clear boundary
                    </Button>
                  </>
                )}
              </>
            ) : (
              <Button type="button" onClick={() => setMode("pick")} className="h-11 px-4 text-[13px]">
                {mode === "draw" ? "Cancel drawing" : "Done editing"}
              </Button>
            )}
          </div>
          <ZoneLocationPicker
            point={point}
            onPick={pick}
            corners={corners}
            color={color}
            mode={mode}
            onBoundaryChange={changeBoundary}
          />
          <p className="text-sm text-muted-foreground">{HELP[mode]}</p>
          <p role="status" className="text-sm text-destructive empty:hidden">
            {pickedOutside && mode === "pick" ? OUTSIDE_MI_ISI_MESSAGE : null}
          </p>
        </div>
      )}
    </div>
  );
}
