import type { Metadata } from "next";
import { Suspense } from "react";

import { BackToBroadcasts } from "@/components/broadcast/back-to-broadcasts";
import { BroadcastSummary, BroadcastSummarySkeleton } from "@/components/broadcast/broadcast-summary";

export const metadata: Metadata = {
  title: "Broadcast · Mi-isi Disaster Alert",
};

export default function BroadcastPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <BackToBroadcasts />
      <Suspense fallback={<BroadcastSummarySkeleton />}>
        <BroadcastSummary params={params} />
      </Suspense>
    </div>
  );
}
