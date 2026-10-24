import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink } from "@/components/layout/back-link";
import { ZoneDetail, ZoneDetailSkeleton } from "@/components/zones/zone-detail";

export const metadata: Metadata = {
  title: "Zone · Mi-isi Disaster Alert",
};

export default function ZonePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pt-[22px] pb-8">
      <BackLink href="/zones" label="Farm zones" />
      <Suspense fallback={<ZoneDetailSkeleton />}>
        <ZoneDetail params={params} />
      </Suspense>
    </div>
  );
}
