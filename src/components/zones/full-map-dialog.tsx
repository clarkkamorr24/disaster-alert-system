"use client";

import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ZoneMapClient } from "@/components/zones/zone-map-client";
import type { ZoneMapPoint } from "@/types/zone";

/**
 * The "Full map" button and the near-full-screen map it opens. The map is only
 * mounted while the dialog is open (Base UI unmounts the popup after its close
 * animation), and focus returns to the button on close.
 */
export function FullMapDialog({ zones }: { zones: ZoneMapPoint[] }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" className="h-11 shrink-0 gap-[7px] px-3 text-xs sm:h-[39px]">
            <Eye className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
            Full map
          </Button>
        }
      />
      <DialogContent className="flex h-[85svh] max-w-[95vw] flex-col gap-3 sm:max-w-[min(1200px,95vw)]">
        <div className="pr-10">
          <DialogTitle className="font-heading text-[15px] font-bold tracking-[-0.03em]">Zone overview</DialogTitle>
          <DialogDescription className="mt-1 text-xs">
            Pins are colored by each zone&rsquo;s worst active alert. Select a pin for details.
          </DialogDescription>
        </div>
        <ZoneMapClient zones={zones} className="min-h-0 flex-1 overflow-hidden rounded-lg border" />
      </DialogContent>
    </Dialog>
  );
}
