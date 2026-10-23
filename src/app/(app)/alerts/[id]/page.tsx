import type { Metadata } from "next";
import { Suspense } from "react";

import { AlertDetail, AlertDetailSkeleton } from "@/components/alerts/alert-detail";
import { BackToAlerts } from "@/components/alerts/back-to-alerts";

export const metadata: Metadata = {
  title: "Alert · Mi-isi Disaster Alert",
};

export default function AlertPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <BackToAlerts />
      <Suspense fallback={<AlertDetailSkeleton />}>
        <AlertDetail params={params} />
      </Suspense>
    </div>
  );
}
