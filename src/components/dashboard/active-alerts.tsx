import { ChevronRight, MapIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

import { SectionHeader, SectionHeaderSkeleton } from "@/components/dashboard/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { Severity } from "@/generated/prisma/enums";
import { requireOfficer } from "@/lib/auth/dal";
import { formatManilaDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { HAZARD_TYPES } from "@/lib/domain/hazards";
import { zonesLabel } from "@/lib/domain/zones-label";

/** The 4px left accent, in the severity's map marker color. */
const ACCENT_CLASS: Record<Severity, string> = {
  CRITICAL: "before:bg-marker-critical",
  HIGH: "before:bg-marker-high",
  MODERATE: "before:bg-marker-moderate",
  LOW: "before:bg-marker-low",
};

/** Every active alert as a card linking to it, newest first. Render inside `<Suspense>`. */
export async function ActiveAlerts() {
  await requireOfficer();

  const [alerts, totalZones] = await Promise.all([
    prisma.hazardAlert.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        hazardType: true,
        severity: true,
        officialLevel: true,
        createdAt: true,
        zones: { select: { name: true } },
      },
    }),
    prisma.farmZone.count(),
  ]);

  return (
    <section aria-labelledby="active-alerts-heading">
      <SectionHeader
        id="active-alerts-heading"
        title="Active alerts"
        description="Hazards currently affecting your farm zones"
        href="/alerts"
        linkLabel="View all alerts"
      />

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-6 text-center">
          <ShieldCheck className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No active alerts.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-[14px]">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Link
                href={`/alerts/${alert.id}`}
                className={cn(
                  "group relative flex h-full min-h-[170px] flex-col overflow-hidden rounded-xl border bg-card pt-[18px] pr-5 pb-4 pl-[23px] transition-colors hover:border-accent-border",
                  "before:absolute before:inset-y-0 before:left-0 before:w-1",
                  ACCENT_CLASS[alert.severity],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-[.08em] text-[#8a958e] uppercase dark:text-muted-foreground">
                      {HAZARD_TYPES[alert.hazardType].label}
                    </p>
                    <h3 className="mt-[3px] font-heading text-lg font-bold tracking-[-0.03em]">{alert.title}</h3>
                    {alert.officialLevel && (
                      <p className="mt-0.5 text-xs font-medium text-[#5f6e64] dark:text-muted-foreground">
                        {alert.officialLevel}
                      </p>
                    )}
                  </div>
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f5f7f5] text-[#96a198] transition-colors group-hover:bg-[#eaf1ec] dark:bg-muted dark:text-muted-foreground"
                  >
                    <ChevronRight className="size-4" />
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-row-border pt-3 text-[13px] text-[#859087] dark:text-muted-foreground">
                  <span className="flex min-w-0 items-center gap-[5px]">
                    <MapIcon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    {zonesLabel(
                      alert.zones.map((zone) => zone.name),
                      totalZones,
                    )}
                  </span>
                  <span className="shrink-0">{formatManilaDateTime(alert.createdAt)}</span>
                </div>
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
    <div>
      <SectionHeaderSkeleton />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-[14px]">
        <Skeleton className="h-[170px] rounded-xl" />
        <Skeleton className="h-[170px] rounded-xl" />
      </div>
    </div>
  );
}
