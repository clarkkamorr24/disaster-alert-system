import { Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { HazardBadge } from "@/components/alerts/hazard-badge";
import { SeverityBadge } from "@/components/alerts/severity-badge";
import { SectionHeader } from "@/components/dashboard/section-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

/** Every active alert as a card linking to it, newest first. Render inside `<Suspense>`. */
export async function ActiveAlerts() {
  await requireOfficer();

  const alerts = await prisma.hazardAlert.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      hazardType: true,
      severity: true,
      officialLevel: true,
      zones: { orderBy: { name: "asc" }, select: { name: true } },
    },
  });

  return (
    <section aria-labelledby="active-alerts-heading" className="flex flex-col gap-3">
      <SectionHeader id="active-alerts-heading" title="Active alerts" viewAllHref="/alerts" />

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center">
          <ShieldCheck className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">No active alerts.</p>
          <Link href="/alerts/new" className={buttonVariants({ className: "h-11 px-4 text-base" })}>
            <Plus data-icon="inline-start" />
            New alert
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Link
                href={`/alerts/${alert.id}`}
                className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4 hover:bg-muted"
              >
                <HazardBadge type={alert.hazardType} />
                <span className="font-medium">{alert.title}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={alert.severity} />
                  {alert.officialLevel && (
                    <span className="text-sm text-muted-foreground">{alert.officialLevel}</span>
                  )}
                </div>
                <span className="text-sm">{alert.zones.map((zone) => zone.name).join(", ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Placeholder while {@link ActiveAlerts} loads. */
export function ActiveAlertsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-11 w-40" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
    </div>
  );
}
