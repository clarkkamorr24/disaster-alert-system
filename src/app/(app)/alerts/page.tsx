import type { Metadata } from "next";
import { Suspense } from "react";

import { AlertList, AlertListSkeleton } from "@/components/alerts/alert-list";

export const metadata: Metadata = {
  title: "Alerts · Mi-isi Disaster Alert",
};

// The "New alert" button lives in the top bar on every page.
export default function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Alerts</h1>

      <Suspense fallback={<AlertListSkeleton />}>
        <AlertList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
