import { MapPin, MessageSquareText, Siren, Users, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

function loadCounts() {
  const since = new Date(Date.now() - 30 * DAY_MS);
  return Promise.all([
    prisma.hazardAlert.count({ where: { status: "ACTIVE" } }),
    prisma.farmZone.count(),
    prisma.member.count({ where: { isActive: true } }),
    prisma.broadcast.count({ where: { createdAt: { gte: since } } }),
  ]);
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <Card className="flex-row items-start justify-between gap-2 px-4">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-3xl font-semibold tabular-nums">{value.toLocaleString("en-PH")}</span>
      </div>
      <span className="hidden size-10 shrink-0 items-center sm:flex justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
    </Card>
  );
}

/** Active alerts, zones, active members, and broadcasts in the last 30 days. Render inside `<Suspense>`. */
export async function StatCards() {
  await requireOfficer();
  const [activeAlerts, zones, activeMembers, recentBroadcasts] = await loadCounts();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Active alerts" value={activeAlerts} icon={Siren} />
      <StatCard label="Farm zones" value={zones} icon={MapPin} />
      <StatCard label="Active members" value={activeMembers} icon={Users} />
      <StatCard label="Broadcasts (last 30 days)" value={recentBroadcasts} icon={MessageSquareText} />
    </div>
  );
}

/** Placeholder while {@link StatCards} loads. */
export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}
