import type { Metadata } from "next";
import { Suspense } from "react";

import { ActiveAlerts, ActiveAlertsSkeleton } from "@/components/dashboard/active-alerts";
import { CreditCard, CreditCardSkeleton } from "@/components/dashboard/credit-card";
import { RecentBroadcasts, RecentBroadcastsSkeleton } from "@/components/dashboard/recent-broadcasts";
import { StatCards, StatCardsSkeleton } from "@/components/dashboard/stat-cards";
import { ZoneOverview, ZoneOverviewSkeleton } from "@/components/dashboard/zone-overview";

export const metadata: Metadata = {
  title: "Dashboard · Mi-isi Disaster Alert",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<ActiveAlertsSkeleton />}>
            <ActiveAlerts />
          </Suspense>
        </div>
        <Suspense fallback={<CreditCardSkeleton />}>
          <CreditCard />
        </Suspense>
      </div>

      <Suspense fallback={<ZoneOverviewSkeleton />}>
        <ZoneOverview />
      </Suspense>

      <Suspense fallback={<RecentBroadcastsSkeleton />}>
        <RecentBroadcasts />
      </Suspense>
    </div>
  );
}
