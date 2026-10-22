import { ChevronLeft, ChevronRight, Phone, Users } from "lucide-react";
import Link from "next/link";

import { MemberFilters } from "@/components/members/member-filters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { prisma } from "@/lib/db";
import { formatPhoneForDisplay } from "@/lib/domain/phone";
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

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "outline" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
  );
}

function hasFilters(filters: MemberListFilters): boolean {
  return filters.q !== "" || filters.zoneId !== undefined || filters.status !== "active";
}

interface PaginationProps {
  filters: MemberListFilters;
  page: number;
  pageCount: number;
}

function Pagination({ filters, page, pageCount }: PaginationProps) {
  if (pageCount <= 1) return null;
  const linkClass = buttonVariants({ variant: "outline", className: "h-11 px-4 text-base" });
  const disabledClass = `${linkClass} pointer-events-none opacity-50`;

  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={memberListHref(filters, page - 1)} className={linkClass}>
          <ChevronLeft data-icon="inline-start" />
          Previous
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          <ChevronLeft data-icon="inline-start" />
          Previous
        </span>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={memberListHref(filters, page + 1)} className={linkClass}>
          Next
          <ChevronRight data-icon="inline-end" />
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          Next
          <ChevronRight data-icon="inline-end" />
        </span>
      )}
    </nav>
  );
}

/**
 * The member registry with search, zone and status filters, and 50 per page:
 * a table from `md` up, cards below. Render inside `<Suspense>`.
 */
export async function MemberList({ searchParams }: MemberListProps) {
  const filters = parseMemberListFilters(await searchParams);
  await requireOfficer();

  const where = memberListWhere(filters);
  const [zones, total] = await Promise.all([getZoneOptions(), prisma.member.count({ where })]);
  const pageCount = Math.max(1, Math.ceil(total / MEMBERS_PER_PAGE));
  const page = Math.min(filters.page, pageCount);

  const members = await prisma.member.findMany({
    where,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    skip: (page - 1) * MEMBERS_PER_PAGE,
    take: MEMBERS_PER_PAGE,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      isActive: true,
      zone: { select: { name: true } },
    },
  });

  const first = (page - 1) * MEMBERS_PER_PAGE + 1;
  const last = first + members.length - 1;

  return (
    <>
      {/* Keyed by the URL so a "Clear filters" navigation resets the fields. */}
      <MemberFilters key={memberListHref(filters, 1)} filters={filters} zones={zones} />

      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
          <Users className="size-6 text-muted-foreground" aria-hidden="true" />
          {hasFilters(filters) ? (
            <>
              <p className="text-muted-foreground">No members match these filters.</p>
              <Link href="/members" className="inline-flex min-h-11 items-center text-primary hover:underline">
                Clear filters
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground">No active members yet. Add the first member.</p>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {first}–{last} of {total} {total === 1 ? "member" : "members"}
            {hasFilters(filters) && (
              <>
                {" · "}
                <Link href="/members" className="text-primary hover:underline">
                  Clear filters
                </Link>
              </>
            )}
          </p>

          <div className="hidden rounded-xl border md:block">
            <Table className="text-base">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Name</TableHead>
                  <TableHead className="px-4">Phone</TableHead>
                  <TableHead className="px-4">Zone</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="px-4 py-3">
                      <Link
                        href={`/members/${member.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {member.lastName}, {member.firstName}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">
                      {formatPhoneForDisplay(member.phone)}
                    </TableCell>
                    <TableCell className="px-4 py-3">{member.zone.name}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge isActive={member.isActive} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {members.map((member) => (
              <li key={member.id} className="flex flex-col gap-1 rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/members/${member.id}`}
                    className="flex min-h-11 min-w-0 items-center font-medium text-primary hover:underline"
                  >
                    <span className="truncate">
                      {member.firstName} {member.lastName}
                    </span>
                  </Link>
                  {!member.isActive && <StatusBadge isActive={false} />}
                </div>
                <span className="text-sm text-muted-foreground">{member.zone.name}</span>
                <a
                  href={`tel:${member.phone}`}
                  className="inline-flex min-h-11 items-center gap-2 self-start tabular-nums hover:underline"
                >
                  <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
                  {formatPhoneForDisplay(member.phone)}
                </a>
              </li>
            ))}
          </ul>

          <Pagination filters={filters} page={page} pageCount={pageCount} />
        </>
      )}
    </>
  );
}

/** Placeholder while {@link MemberList} loads. */
export function MemberListSkeleton() {
  return (
    <>
      <Skeleton className="h-11 rounded-lg" />
      <Skeleton className="h-96 rounded-xl" />
    </>
  );
}
