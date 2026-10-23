import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ActiveAlerts, ActiveAlertsSkeleton } from "@/components/dashboard/active-alerts";
import { CreditCard, CreditCardSkeleton } from "@/components/dashboard/credit-card";
import { RecentBroadcasts, RecentBroadcastsSkeleton } from "@/components/dashboard/recent-broadcasts";
import { StatCards, StatCardsSkeleton } from "@/components/dashboard/stat-cards";
import { ZoneOverview, ZoneOverviewSkeleton } from "@/components/dashboard/zone-overview";
import { PAGE_ACTION_CLASS, PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard · Mi-isi Disaster Alert",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
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

      <div className="flex flex-col gap-6">
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
    </div>
  );
}
