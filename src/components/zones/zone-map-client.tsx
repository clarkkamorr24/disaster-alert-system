"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import type { ZoneMapPoint } from "@/types/zone";

// Leaflet touches `window` on import, so the map only loads in the browser.
const ZoneMap = dynamic(() => import("./zone-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] rounded-xl md:h-[360px]" />,
});

/** The zone map, loaded in the browser only. Usable from Server Components. */
export function ZoneMapClient({ zones }: { zones: ZoneMapPoint[] }) {
  return (
    // isolate keeps Leaflet's z-indexes (400+) below the mobile sidebar sheet (z-50).
    <div className="isolate">
      <ZoneMap zones={zones} />
    </div>
  );
}
