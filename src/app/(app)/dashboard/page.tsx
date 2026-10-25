import type { Metadata } from "next";
import { Suspense } from "react";

import { CreditStatCard } from "@/components/dashboard/credit-card";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { RecentBroadcasts, RecentBroadcastsSkeleton } from "@/components/dashboard/recent-broadcasts";
import { StatCardSkeleton, StatCards, StatCardsSkeleton } from "@/components/dashboard/stat-cards";
import { ZoneOverview, ZoneOverviewSkeleton } from "@/components/dashboard/zone-overview";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Dashboard · Mi-isi Disaster Alert",
};

export default function DashboardPage() {
  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Association overview"
        title="Dashboard"
        description="Zone status, weather and recent SMS broadcasts."
      />

      {/* Both boundaries share one grid, so the four cards line up whichever loads first. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[14px]">
        <Suspense fallback={<StatCardsSkeleton />}>
          <StatCards />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <CreditStatCard />
        </Suspense>
      </div>

      <Suspense fallback={<ZoneOverviewSkeleton />}>
        <ZoneOverview />
      </Suspense>

      <Suspense fallback={<RecentBroadcastsSkeleton />}>
        <RecentBroadcasts />
      </Suspense>

      <DashboardFooter />
    </div>
  );
}
