import type { Metadata } from "next";
import { Suspense } from "react";

import { BroadcastReport } from "@/components/broadcast/broadcast-report";
import { BroadcastSummarySkeleton } from "@/components/broadcast/broadcast-summary";
import { BackLink } from "@/components/layout/back-link";

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
    <div className="flex w-full flex-col gap-3 pb-8">
      <div className="pt-[22px]">
        <BackLink href="/broadcasts" label="Broadcasts" />
      </div>
      <Suspense fallback={<BroadcastSummarySkeleton />}>
        <BroadcastReport params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
