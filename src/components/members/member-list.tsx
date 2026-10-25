import { CircleAlert, Map as MapIcon, Upload, Users } from "lucide-react";
import Link from "next/link";

import { PaginationFooter } from "@/components/layout/pagination-footer";
import { StatStrip } from "@/components/layout/stat-strip";
import { SearchField, TableToolbar } from "@/components/layout/table-toolbar";
import { MemberFilters } from "@/components/members/member-filters";
import { MemberTable } from "@/components/members/member-table";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import {
  MEMBERS_PER_PAGE,
  memberListHref,
  memberListWhere,
  parseMemberListFilters,
} from "@/lib/members/list-filters";
import { getZoneOptions } from "@/lib/zone-options";
import type { MemberListFilters } from "@/types/member";

interface MemberListProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Counts for the stat strip; they ignore the search and filters. */
async function loadStats() {
  const [active, zones, inactive] = await Promise.all([
    prisma.member.count({ where: { isActive: true } }),
    prisma.farmZone.count(),
    prisma.member.count({ where: { isActive: false } }),
  ]);
  const format = (n: number) => n.toLocaleString("en-US");
  return [
    { label: "Active members", value: format(active), icon: Users, tone: "clear" as const },
    { label: "Farm zones", value: format(zones), icon: MapIcon, tone: "info" as const },
    { label: "Deactivated", value: format(inactive), icon: CircleAlert, tone: "moderate" as const },
  ];
}

async function loadMembers(filters: MemberListFilters) {
  const where = memberListWhere(filters);
  const [rows, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (filters.page - 1) * filters.size,
      take: filters.size,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        crops: true,
        isActive: true,
        consentAt: true,
        zone: { select: { name: true } },
      },
    }),
    prisma.member.count({ where }),
  ]);
  return { rows, total };
}

const LINK_CLASS = "inline-flex min-h-11 items-center text-xs font-bold text-link hover:text-primary-hover";

/** Shown instead of the table: past the last page, no matches, or no members yet. */
function EmptyState({ filters, pastEnd }: { filters: MemberListFilters; pastEnd: boolean }) {
  const filtered = filters.q !== "" || filters.zoneId !== undefined || filters.status !== "active";
  if (pastEnd) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center">
        <p className="text-sm text-muted-foreground">There are no members on this page.</p>
        <Link href={memberListHref(filters, 1)} className={LINK_CLASS}>
          Go to the first page
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <Users className="size-6 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        {filtered ? "No members match these filters." : "No active members yet. Add the first member."}
      </p>
      {filtered && (
        <Link href="/members" className={LINK_CLASS}>
          Clear filters
        </Link>
      )}
    </div>
  );
}

/**
 * The member registry: a stat strip, then a card with search, Import CSV, zone
 * and status filters, the table, and pagination (10 per page unless `?size=` says otherwise). Render inside `<Suspense>`.
 */
export async function MemberList({ searchParams }: MemberListProps) {
  const filters = parseMemberListFilters(await searchParams);
  await requireOfficer();

  const [stats, zones, { rows, total }] = await Promise.all([loadStats(), getZoneOptions(), loadMembers(filters)]);

  const skip = (filters.page - 1) * filters.size;
  const lastPage = Math.max(1, Math.ceil(total / filters.size));
  const pastEnd = total > 0 && filters.page > lastPage;

  return (
    <>
      <StatStrip items={stats} />
      <div className="overflow-hidden rounded-xl border bg-card">
        <TableToolbar>
          <SearchField
            action="/members"
            label="Search members"
            placeholder="Search name or phone…"
            defaultValue={filters.q}
            keep={{
              zone: filters.zoneId ?? null,
              status: filters.status === "active" ? null : filters.status,
              size: filters.size === MEMBERS_PER_PAGE ? null : String(filters.size),
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Link
              href="/members/import"
              className={buttonVariants({ variant: "outline", className: "h-11 gap-[7px] px-3 text-xs sm:h-[39px]" })}
            >
              <Upload className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
              Import CSV
            </Link>
            <MemberFilters filters={filters} zones={zones} />
          </div>
        </TableToolbar>
        {rows.length === 0 ? <EmptyState filters={filters} pastEnd={pastEnd} /> : <MemberTable rows={rows} />}
        <PaginationFooter
          from={rows.length === 0 ? 0 : skip + 1}
          to={skip + rows.length}
          total={total}
          noun={total === 1 ? "member" : "members"}
          prevHref={filters.page > 1 ? memberListHref(filters, Math.min(filters.page - 1, lastPage)) : null}
          nextHref={skip + rows.length < total ? memberListHref(filters, filters.page + 1) : null}
          page={filters.page}
          pageCount={lastPage}
          size={filters.size}
          sizeHref={(size) => memberListHref({ ...filters, size }, 1)}
        />
      </div>
    </>
  );
}

/** Placeholder while {@link MemberList} loads. */
export function MemberListSkeleton() {
  return (
    <>
      <Skeleton className="mb-[18px] h-[88px] rounded-xl" />
      <Skeleton className="h-[480px] rounded-xl" />
    </>
  );
}
