import type { Metadata } from "next";
import { Suspense } from "react";

import { BackToBroadcasts } from "@/components/broadcast/back-to-broadcasts";
import { BroadcastReport } from "@/components/broadcast/broadcast-report";
import { BroadcastSummarySkeleton } from "@/components/broadcast/broadcast-summary";

export const metadata: Metadata = {
  title: "Broadcast · Mi-isi Disaster Alert",
};

export default function BroadcastPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <BackToBroadcasts />
      <Suspense fallback={<BroadcastSummarySkeleton />}>
        <BroadcastReport params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
