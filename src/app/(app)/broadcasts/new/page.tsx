import type { Metadata } from "next";
import { Suspense } from "react";

import { BackToBroadcasts } from "@/components/broadcast/back-to-broadcasts";
import { ComposeBroadcast, ComposeBroadcastSkeleton } from "@/components/broadcast/compose-broadcast";

export const metadata: Metadata = {
  title: "New broadcast · Mi-isi Disaster Alert",
};

export default function NewBroadcastPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackToBroadcasts />
        <h1 className="text-2xl font-semibold">New broadcast</h1>
      </div>
      <Suspense fallback={<ComposeBroadcastSkeleton />}>
        <ComposeBroadcast searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
