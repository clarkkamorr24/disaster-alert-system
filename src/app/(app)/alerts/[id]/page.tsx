import type { Metadata } from "next";
import { Suspense } from "react";

import { AlertDetail, AlertDetailSkeleton } from "@/components/alerts/alert-detail";
import { BackLink } from "@/components/layout/back-link";

export const metadata: Metadata = {
  title: "Alert · Mi-isi Disaster Alert",
};

export default function AlertPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pt-[22px] pb-8">
      <BackLink href="/alerts" label="Hazard alerts" />
      <Suspense fallback={<AlertDetailSkeleton />}>
        <AlertDetail params={params} />
      </Suspense>
    </div>
  );
}
