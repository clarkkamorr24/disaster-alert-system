"use client";

import dynamic from "next/dynamic";
import { cn } from "cn";

import { Skeleton } from "@/components/ui/skeleton";
import type { ZoneMapPoint } from "@/types/zone";

// Leaflet touches `window` on import, so the map only loads in the browser.
const ZoneMap = dynamic(() => import("./zone-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

interface ZoneMapClientProps {
  zones: ZoneMapPoint[];
  /** Sizes the map, such as `h-[275px]`. */
  className: string;
}

/** The zone map, loaded in the browser only. Usable from Server Components. */
export function ZoneMapClient({ zones, className }: ZoneMapClientProps) {
  return (
    // isolate keeps Leaflet's z-indexes (400+) below the mobile sidebar sheet (z-50).
    <div className={cn("relative isolate", className)}>
      <ZoneMap zones={zones} />
    </div>
  );
}
