import { ChevronLeft, ChevronRight, MessageSquareText, Repeat } from "lucide-react";
import Link from "next/link";

import { HazardBadge } from "@/components/alerts/hazard-badge";
import { BroadcastStatusBadge } from "@/components/broadcast/broadcast-status-badge";
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
import type { HazardType } from "@/generated/prisma/enums";
import { requireOfficer } from "@/lib/auth/dal";
import { loadBroadcastSummaries } from "@/lib/broadcast/summaries";
import { formatManilaDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/db";

/** Broadcasts shown per page. */
const BROADCASTS_PER_PAGE = 25;

interface BroadcastListProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parsePage(value: string | string[] | undefined): number {
  const page = typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  return Number.isInteger(page) && page > 1 ? page : 1;
}

function pageHref(page: number): string {
  return page > 1 ? `/broadcasts?page=${page}` : "/broadcasts";
}

function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const linkClass = buttonVariants({ variant: "outline", className: "h-11 px-4 text-base" });
  const disabledClass = `${linkClass} pointer-events-none opacity-50`;

  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={pageHref(page - 1)} className={linkClass}>
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
        <Link href={pageHref(page + 1)} className={linkClass}>
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

/** What the broadcast was about: the alert's hazard and title, or "Announcement". */
export function BroadcastAbout({ alert }: { alert: { title: string; hazardType: HazardType } | null }) {
  if (!alert) return <span className="text-muted-foreground">Announcement</span>;
  return (
    <span className="flex flex-col items-start gap-1">
      <HazardBadge type={alert.hazardType} />
      <span>{alert.title}</span>
    </span>
  );
}

function ResendBadge() {
  return (
    <Badge variant="secondary">
      <Repeat data-icon="inline-start" />
      Resend
    </Badge>
  );
}

/** Broadcast history, 25 per page, newest first: a table from `md` up, cards below. Render inside `<Suspense>`. */
export async function BroadcastList({ searchParams }: BroadcastListProps) {
  const { page: pageParam } = await searchParams;
  await requireOfficer();

  const total = await prisma.broadcast.count();
  const pageCount = Math.max(1, Math.ceil(total / BROADCASTS_PER_PAGE));
  const page = Math.min(parsePage(pageParam), pageCount);
  const broadcasts = await loadBroadcastSummaries((page - 1) * BROADCASTS_PER_PAGE, BROADCASTS_PER_PAGE);

  if (broadcasts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
        <MessageSquareText className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">No broadcasts yet. Send one from an alert or with New broadcast.</p>
      </div>
    );
  }

  const recipients = (count: number) => `${count} ${count === 1 ? "member" : "members"}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="hidden rounded-xl border md:block">
        <Table className="text-base">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Sent</TableHead>
              <TableHead className="px-4">About</TableHead>
              <TableHead className="px-4">Recipients</TableHead>
              <TableHead className="px-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {broadcasts.map((broadcast) => (
              <TableRow key={broadcast.id}>
                <TableCell className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <Link href={`/broadcasts/${broadcast.id}`} className="font-medium text-primary hover:underline">
                      {formatManilaDateTime(broadcast.createdAt)}
                    </Link>
                    {broadcast.retryOfId && <ResendBadge />}
                  </div>
                </TableCell>
                <TableCell className="max-w-72 px-4 py-3 whitespace-normal">
                  <BroadcastAbout alert={broadcast.alert} />
                </TableCell>
                <TableCell className="px-4 py-3 tabular-nums">{recipients(broadcast.recipientCount)}</TableCell>
                <TableCell className="px-4 py-3">
                  <BroadcastStatusBadge status={broadcast.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {broadcasts.map((broadcast) => (
          <li key={broadcast.id}>
            <Link
              href={`/broadcasts/${broadcast.id}`}
              className="flex min-h-11 items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:bg-muted"
            >
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formatManilaDateTime(broadcast.createdAt)}</span>
                  {broadcast.retryOfId && <ResendBadge />}
                </div>
                <BroadcastAbout alert={broadcast.alert} />
                <div className="flex flex-wrap items-center gap-2">
                  <BroadcastStatusBadge status={broadcast.status} />
                  <span className="text-sm text-muted-foreground">{recipients(broadcast.recipientCount)}</span>
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <Pagination page={page} pageCount={pageCount} />
    </div>
  );
}

/** Placeholder while {@link BroadcastList} loads. */
export function BroadcastListSkeleton() {
  return <Skeleton className="h-64 rounded-xl" />;
}
