import { CircleAlert, MessageSquareText, Users } from "lucide-react";

import { StatCard } from "@/components/layout/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { deliveryRate, emptyStatusCounts, formatRate } from "@/lib/broadcast/status";
import { prisma } from "@/lib/db";

function plural(count: number, one: string, many: string) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;
}

async function loadStats() {
  const [activeAlerts, criticalAlerts, activeMembers, zones, groups] = await Promise.all([
    prisma.hazardAlert.count({ where: { status: "ACTIVE" } }),
    prisma.hazardAlert.count({ where: { status: "ACTIVE", severity: "CRITICAL" } }),
    prisma.member.count({ where: { isActive: true } }),
    prisma.farmZone.count(),
    prisma.broadcastRecipient.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts = emptyStatusCounts();
  for (const group of groups) counts[group.status] = group._count._all;
  return { activeAlerts, criticalAlerts, activeMembers, zones, counts };
}

/**
 * Three of the four dashboard stat cards (alerts, members, delivery rate), as a
 * fragment for the page's stat grid. Render inside `<Suspense>`.
 */
export async function StatCards() {
  await requireOfficer();
  const { activeAlerts, criticalAlerts, activeMembers, zones, counts } = await loadStats();

  return (
    <>
      <StatCard
        label="Active alerts"
        value={activeAlerts.toLocaleString("en-US")}
        hint={`${criticalAlerts.toLocaleString("en-US")} critical`}
        icon={CircleAlert}
        tone="critical"
        hintPulse={criticalAlerts > 0}
      />
      <StatCard
        label="Active members"
        value={activeMembers.toLocaleString("en-US")}
        hint={plural(zones, "farm zone", "farm zones")}
        icon={Users}
        tone="clear"
      />
      <StatCard
        label="Delivery rate"
        value={formatRate(deliveryRate(counts))}
        hint={`${(counts.FAILED + counts.SKIPPED).toLocaleString("en-US")} not reached`}
        icon={MessageSquareText}
        tone="info"
      />
    </>
  );
}

/** One stat card's placeholder. */
export function StatCardSkeleton() {
  return <Skeleton className="h-[112px] rounded-xl" />;
}

/** Placeholder while {@link StatCards} loads. */
export function StatCardsSkeleton() {
  return (
    <>
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </>
  );
}
