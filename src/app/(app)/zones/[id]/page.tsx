import type { Metadata } from "next";
import { Suspense } from "react";

import { BackToZones } from "@/components/zones/back-to-zones";
import { ZoneDetail, ZoneDetailSkeleton } from "@/components/zones/zone-detail";

export const metadata: Metadata = {
  title: "Zone · Mi-isi Disaster Alert",
};

export default function ZonePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <BackToZones />
      <Suspense fallback={<ZoneDetailSkeleton />}>
        <ZoneDetail params={params} />
      </Suspense>
    </div>
  );
}
