import type { Metadata } from "next";
import { Suspense } from "react";

import { AlertList, AlertListSkeleton } from "@/components/alerts/alert-list";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Alerts · Mi-isi Disaster Alert",
};

export default function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Association records"
        title="Hazard alerts"
        description="Log, monitor, and resolve hazards affecting your farm zones."
      />

      <Suspense fallback={<AlertListSkeleton />}>
        <AlertList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
