import { MessageSquareText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "cn";

import { HazardIconTile } from "@/components/alerts/hazard-icon-tile";
import { ResolveAlertButton } from "@/components/alerts/resolve-alert-button";
import { BroadcastRows } from "@/components/broadcast/broadcast-rows";
import { StatusPill } from "@/components/layout/status-pill";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { loadBroadcastSummaries, loadBroadcastZoneNames } from "@/lib/broadcast/summaries";
import { formatManilaDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { HAZARD_TYPES, SEVERITIES } from "@/lib/domain/hazards";
import { severityTone } from "@/lib/domain/status-tone";

interface AlertDetailProps {
  params: Promise<{ id: string }>;
}

/** More than any alert has broadcasts in practice; the list isn't paginated. */
const BROADCAST_LIMIT = 50;

function DetailCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-5", className)}>
      <h2 className="font-heading text-base font-bold tracking-[-0.03em]">{title}</h2>
      {children}
    </section>
  );
}

function loadAlert(id: string) {
  return prisma.hazardAlert.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      hazardType: true,
      severity: true,
      officialLevel: true,
      description: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      zones: { orderBy: { name: "asc" }, select: { id: true, name: true } },
    },
  });
}

async function loadBroadcasts(alertId: string) {
  const [broadcasts, totalZones] = await Promise.all([
    loadBroadcastSummaries(0, BROADCAST_LIMIT, { alertId }),
    prisma.farmZone.count(),
  ]);
  const zoneNames = await loadBroadcastZoneNames(broadcasts.map((broadcast) => broadcast.id));
  return { broadcasts, zoneNames, totalZones };
}

/** The header, details, affected zones, and broadcasts of one alert. Render inside `<Suspense>`. */
export async function AlertDetail({ params }: AlertDetailProps) {
  const { id } = await params;
  await requireOfficer();

  const [alert, { broadcasts, zoneNames, totalZones }] = await Promise.all([loadAlert(id), loadBroadcasts(id)]);
  if (!alert) notFound();

  const isActive = alert.status === "ACTIVE";
  const times = [`Logged ${formatManilaDateTime(alert.createdAt)}`];
  if (alert.resolvedAt) times.push(`Resolved ${formatManilaDateTime(alert.resolvedAt)}`);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-card p-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <HazardIconTile type={alert.hazardType} className="size-11 rounded-[10px] [&_svg]:size-[22px]" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[11px] font-bold tracking-[.08em] text-muted-foreground uppercase">
              {HAZARD_TYPES[alert.hazardType].label}
            </p>
            <h1 className="font-heading text-[22px] leading-tight font-bold tracking-[-0.03em]">{alert.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <StatusPill tone={severityTone(alert.severity)}>{SEVERITIES[alert.severity].label}</StatusPill>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold",
                  isActive ? "text-status-clear" : "text-status-neutral",
                )}
              >
                <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                {isActive ? "Active" : "Resolved"}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground">{times.join(" · ")}</p>
          </div>
        </div>
        {isActive && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/broadcasts/new?alertId=${alert.id}`}
              className={buttonVariants({ className: "h-11 gap-2 px-4 text-[13px]" })}
            >
              <MessageSquareText data-icon="inline-start" />
              Send SMS about this alert
            </Link>
            <ResolveAlertButton id={alert.id} />
          </div>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <DetailCard title="Details">
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Official level</dt>
              <dd>{alert.officialLevel ?? <span className="text-muted-foreground">Not given</span>}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Recommended precautions</dt>
              <dd className="whitespace-pre-wrap">
                {alert.description || <span className="text-muted-foreground">None recorded</span>}
              </dd>
            </div>
          </dl>
        </DetailCard>

        <DetailCard title="Affected zones">
          {alert.zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">The zones this alert named have since been deleted.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {alert.zones.map((zone) => (
                <li key={zone.id}>
                  <Link
                    href={`/zones/${zone.id}`}
                    className="inline-flex min-h-11 items-center rounded-lg border border-accent-border bg-accent px-3 text-xs font-semibold text-primary hover:bg-[#e5f2e8] sm:min-h-[34px] dark:hover:bg-accent/70"
                  >
                    {zone.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DetailCard>
      </div>

      <section aria-labelledby="alert-broadcasts-heading" className="flex flex-col gap-3">
        <h2 id="alert-broadcasts-heading" className="font-heading text-lg font-bold tracking-[-0.03em]">
          Broadcasts
        </h2>
        {broadcasts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card p-6 text-center">
            <MessageSquareText className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No SMS sent for this alert yet.</p>
          </div>
        ) : (
          <BroadcastRows broadcasts={broadcasts} zoneNames={zoneNames} totalZones={totalZones} />
        )}
      </section>
    </>
  );
}

/** Placeholder while {@link AlertDetail} loads. */
export function AlertDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-36 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
    </>
  );
}
