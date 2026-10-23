import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { HazardBadge } from "@/components/alerts/hazard-badge";
import { SeverityBadge } from "@/components/alerts/severity-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOfficer } from "@/lib/auth/dal";
import { formatManilaDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import type { AlertTab } from "@/types/alert";

interface AlertListProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TABS: { tab: AlertTab; label: string; href: string }[] = [
  { tab: "active", label: "Active", href: "/alerts" },
  { tab: "resolved", label: "Resolved", href: "/alerts?tab=resolved" },
];

function AlertTabs({ current }: { current: AlertTab }) {
  return (
    <nav aria-label="Alert status" className="flex w-fit gap-1 rounded-lg bg-muted p-1">
      {TABS.map(({ tab, label, href }) => (
        <Link
          key={tab}
          href={href}
          aria-current={tab === current ? "page" : undefined}
          className="inline-flex min-h-11 items-center rounded-md px-4 font-medium text-muted-foreground hover:text-foreground aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** The alert log: Active / Resolved tabs, newest first; a table from `md` up, cards below. Render inside `<Suspense>`. */
export async function AlertList({ searchParams }: AlertListProps) {
  const { tab: tabParam } = await searchParams;
  await requireOfficer();

  const tab: AlertTab = tabParam === "resolved" ? "resolved" : "active";
  const resolved = tab === "resolved";

  const alerts = await prisma.hazardAlert.findMany({
    where: { status: resolved ? "RESOLVED" : "ACTIVE" },
    orderBy: resolved ? [{ resolvedAt: "desc" }, { createdAt: "desc" }] : { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      hazardType: true,
      severity: true,
      officialLevel: true,
      createdAt: true,
      resolvedAt: true,
      zones: { orderBy: { name: "asc" }, select: { name: true } },
    },
  });

  const dateLabel = resolved ? "Resolved" : "Logged";
  const dateOf = (alert: (typeof alerts)[number]) =>
    formatManilaDateTime(resolved && alert.resolvedAt ? alert.resolvedAt : alert.createdAt);
  const zoneNames = (alert: (typeof alerts)[number]) =>
    alert.zones.map((zone) => zone.name).join(", ");

  return (
    <div className="flex flex-col gap-4">
      <AlertTabs current={tab} />

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
          <ShieldCheck className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">
            {resolved ? "No resolved alerts yet." : "No active alerts. All zones are clear."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden rounded-xl border md:block">
            <Table className="text-base">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Hazard</TableHead>
                  <TableHead className="px-4">Title</TableHead>
                  <TableHead className="px-4">Severity</TableHead>
                  <TableHead className="px-4">Affected zones</TableHead>
                  <TableHead className="px-4">{dateLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="px-4 py-3">
                      <HazardBadge type={alert.hazardType} />
                    </TableCell>
                    <TableCell className="max-w-64 px-4 py-3 whitespace-normal">
                      <Link href={`/alerts/${alert.id}`} className="font-medium text-primary hover:underline">
                        {alert.title}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <SeverityBadge severity={alert.severity} />
                        {alert.officialLevel && (
                          <span className="text-sm text-muted-foreground">{alert.officialLevel}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-56 px-4 py-3 whitespace-normal">
                      {zoneNames(alert)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">{dateOf(alert)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  href={`/alerts/${alert.id}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:bg-muted"
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <HazardBadge type={alert.hazardType} />
                    <span className="font-medium">{alert.title}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      {alert.officialLevel && (
                        <span className="text-sm text-muted-foreground">{alert.officialLevel}</span>
                      )}
                    </div>
                    <span className="text-sm">{zoneNames(alert)}</span>
                    <span className="text-sm text-muted-foreground">
                      {dateLabel} {dateOf(alert)}
                    </span>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Placeholder while {@link AlertList} loads. */
export function AlertListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-13 w-52 rounded-lg" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
