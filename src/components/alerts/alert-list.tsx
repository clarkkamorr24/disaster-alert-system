import { CircleAlert, CircleCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { AlertFilterPopover } from "@/components/alerts/alert-filter-popover";
import { AlertTable } from "@/components/alerts/alert-table";
import { LinkTabs } from "@/components/layout/link-tabs";
import { PaginationFooter } from "@/components/layout/pagination-footer";
import { StatStrip } from "@/components/layout/stat-strip";
import { SearchField, TableToolbar } from "@/components/layout/table-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Prisma } from "@/generated/prisma/client";
import { requireOfficer } from "@/lib/auth/dal";
import { ALERTS_PER_PAGE, alertListHref, alertListWhere, parseAlertListFilters } from "@/lib/alerts/list-filters";
import { startOfManilaYear } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import type { AlertListFilters, AlertTab } from "@/types/alert";

interface AlertListProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TAB_LABELS: Record<AlertTab, string> = { all: "All alerts", active: "Active", resolved: "Resolved" };

const EMPTY_MESSAGES: Record<AlertTab, string> = {
  all: "No alerts yet.",
  active: "No active alerts.",
  resolved: "No resolved alerts yet.",
};

const ORDER: Record<AlertTab, Prisma.HazardAlertOrderByWithRelationInput[]> = {
  all: [{ createdAt: "desc" }],
  active: [{ createdAt: "desc" }],
  resolved: [{ resolvedAt: "desc" }, { createdAt: "desc" }],
};

/** Counts for the stat strip; they ignore the search and filters. */
async function loadStats(now: Date) {
  const [active, critical, resolvedThisYear] = await Promise.all([
    prisma.hazardAlert.count({ where: { status: "ACTIVE" } }),
    prisma.hazardAlert.count({ where: { status: "ACTIVE", severity: "CRITICAL" } }),
    prisma.hazardAlert.count({ where: { status: "RESOLVED", resolvedAt: { gte: startOfManilaYear(now) } } }),
  ]);
  return [
    { label: "Active alerts", value: String(active), icon: CircleAlert, tone: "critical" as const },
    { label: "Critical", value: String(critical), icon: TriangleAlert, tone: "moderate" as const },
    { label: "Resolved this year", value: String(resolvedThisYear), icon: CircleCheck, tone: "clear" as const },
  ];
}

/** The page of alerts and the count of every tab, all with the same search and filters. */
async function loadAlerts(filters: AlertListFilters) {
  const base = alertListWhere(filters, false);
  const [rows, all, active, resolved, totalZones] = await Promise.all([
    prisma.hazardAlert.findMany({
      where: alertListWhere(filters),
      orderBy: ORDER[filters.tab],
      skip: (filters.page - 1) * ALERTS_PER_PAGE,
      take: ALERTS_PER_PAGE,
      select: {
        id: true,
        title: true,
        hazardType: true,
        severity: true,
        officialLevel: true,
        status: true,
        createdAt: true,
        zones: { select: { name: true } },
      },
    }),
    prisma.hazardAlert.count({ where: base }),
    prisma.hazardAlert.count({ where: { ...base, status: "ACTIVE" } }),
    prisma.hazardAlert.count({ where: { ...base, status: "RESOLVED" } }),
    prisma.farmZone.count(),
  ]);
  const counts: Record<AlertTab, number> = { all, active, resolved };
  return { rows, total: counts[filters.tab], counts, totalZones };
}

const LINK_CLASS = "inline-flex min-h-11 items-center text-xs font-bold text-link hover:text-primary-hover";

/** Shown instead of the table: past the last page, no matches, or an empty tab. */
function EmptyState({ filters, pastEnd }: { filters: AlertListFilters; pastEnd: boolean }) {
  const filtered = filters.q !== "" || filters.hazard !== null || filters.severity !== null;
  if (pastEnd) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center">
        <p className="text-sm text-muted-foreground">There are no alerts on this page.</p>
        <Link href={alertListHref(filters, 1)} className={LINK_CLASS}>
          Go to the first page
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <ShieldCheck className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        {filtered ? "No alerts match your search." : EMPTY_MESSAGES[filters.tab]}
      </p>
      {filtered && (
        <Link
          href={alertListHref({ ...filters, q: "", hazard: null, severity: null, page: 1 })}
          className={LINK_CLASS}
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}

/**
 * The alert log: a stat strip, then a card with All / Active / Resolved tabs,
 * search, filters, the table, and 25 per page. Render inside `<Suspense>`.
 */
export async function AlertList({ searchParams }: AlertListProps) {
  const params = await searchParams;
  await requireOfficer();

  const filters = parseAlertListFilters(params);
  const now = new Date();
  const [stats, { rows, total, counts, totalZones }] = await Promise.all([loadStats(now), loadAlerts(filters)]);

  const skip = (filters.page - 1) * ALERTS_PER_PAGE;
  const lastPage = Math.max(1, Math.ceil(total / ALERTS_PER_PAGE));
  const pastEnd = total > 0 && filters.page > lastPage;
  const tabs = (Object.keys(TAB_LABELS) as AlertTab[]).map((tab) => ({
    href: alertListHref({ ...filters, tab, page: 1 }),
    label: TAB_LABELS[tab],
    count: counts[tab],
    current: tab === filters.tab,
  }));

  return (
    <>
      <StatStrip items={stats} />
      <div className="overflow-hidden rounded-xl border bg-card">
        <LinkTabs label="Alert status" tabs={tabs} />
        <TableToolbar>
          <SearchField
            action="/alerts"
            label="Search alerts"
            placeholder="Search alerts…"
            defaultValue={filters.q}
            keep={{ tab: filters.tab === "active" ? null : filters.tab, hazard: filters.hazard, severity: filters.severity }}
          />
          <AlertFilterPopover filters={filters} />
        </TableToolbar>
        {rows.length === 0 ? (
          <EmptyState filters={filters} pastEnd={pastEnd} />
        ) : (
          <AlertTable rows={rows} totalZones={totalZones} now={now} />
        )}
        <PaginationFooter
          from={rows.length === 0 ? 0 : skip + 1}
          to={skip + rows.length}
          total={total}
          noun={total === 1 ? "alert" : "alerts"}
          prevHref={filters.page > 1 ? alertListHref(filters, Math.min(filters.page - 1, lastPage)) : null}
          nextHref={skip + rows.length < total ? alertListHref(filters, filters.page + 1) : null}
        />
      </div>
    </>
  );
}

/** Placeholder while {@link AlertList} loads. */
export function AlertListSkeleton() {
  return (
    <>
      <Skeleton className="mb-[18px] h-[88px] rounded-xl" />
      <Skeleton className="h-[480px] rounded-xl" />
    </>
  );
}
