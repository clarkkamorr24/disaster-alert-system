import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActiveAlerts, ActiveAlertsSkeleton } from "@/components/dashboard/active-alerts";
import { CreditStatCard } from "@/components/dashboard/credit-card";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { RecentBroadcasts, RecentBroadcastsSkeleton } from "@/components/dashboard/recent-broadcasts";
import { StatCardSkeleton, StatCards, StatCardsSkeleton } from "@/components/dashboard/stat-cards";
import { ZoneOverview, ZoneOverviewSkeleton } from "@/components/dashboard/zone-overview";
import { PAGE_ACTION_CLASS, PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard · Mi-isi Disaster Alert",
};

export default function DashboardPage() {
  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Association overview"
        title="Dashboard"
        description="Active hazards, zone conditions and recent SMS broadcasts."
        action={
          <Link href="/alerts/new" className={buttonVariants({ className: PAGE_ACTION_CLASS })}>
            <Plus data-icon="inline-start" />
            New alert
          </Link>
        }
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

      <Suspense fallback={<ActiveAlertsSkeleton />}>
        <ActiveAlerts />
      </Suspense>

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
