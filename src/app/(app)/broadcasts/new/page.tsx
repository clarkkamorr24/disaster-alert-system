import type { Metadata } from "next";
import { Suspense } from "react";

import { ComposeBroadcast, ComposeBroadcastSkeleton } from "@/components/broadcast/compose-broadcast";
import { BackLink } from "@/components/layout/back-link";

export const metadata: Metadata = {
  title: "New broadcast · Mi-isi Disaster Alert",
};

export default function NewBroadcastPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="flex w-full flex-col pb-8">
      <div className="pt-[22px]">
        <BackLink href="/broadcasts" label="Broadcasts" />
      </div>
      {/* The header reads the search params (new or resend), so it streams in with the form. */}
      <Suspense fallback={<ComposeBroadcastSkeleton />}>
        <ComposeBroadcast searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
