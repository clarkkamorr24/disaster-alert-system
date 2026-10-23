import Link from "next/link";
import { notFound } from "next/navigation";

import { BroadcastSummary } from "@/components/broadcast/broadcast-summary";
import { NotReachedPanel } from "@/components/broadcast/not-reached-panel";
import { RECIPIENT_STATUS_DISPLAY } from "@/components/broadcast/recipient-status-badge";
import { RecipientTable } from "@/components/broadcast/recipient-table";
import { StatusFilter } from "@/components/broadcast/status-filter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipientStatus } from "@/generated/prisma/enums";
import { requireOfficer } from "@/lib/auth/dal";
import { deriveBroadcastStatus, emptyStatusCounts } from "@/lib/broadcast/status";
import { prisma } from "@/lib/db";
import type { ReportRecipient } from "@/types/broadcast";

interface BroadcastReportProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseStatus(value: string | string[] | undefined): RecipientStatus | null {
  return Object.values(RecipientStatus).find((status) => status === value) ?? null;
}

/** Not reached sorted by zone (deleted members last), then name. */
function byZoneThenName(a: ReportRecipient, b: ReportRecipient): number {
  if (a.zoneName !== b.zoneName) {
    if (a.zoneName === null) return 1;
    if (b.zoneName === null) return -1;
    return a.zoneName.localeCompare(b.zoneName);
  }
  return a.name.localeCompare(b.name);
}

function loadReport(id: string) {
  return Promise.all([
    prisma.broadcast.findUnique({
      where: { id },
      select: {
        content: true,
        createdAt: true,
        alert: { select: { id: true, title: true, hazardType: true } },
        retryOf: { select: { id: true, createdAt: true } },
      },
    }),
    prisma.broadcastRecipient.findMany({
      where: { broadcastId: id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        failReason: true,
        member: { select: { zone: { select: { name: true } } } },
      },
    }),
  ]);
}

/**
 * A broadcast's delivery report: derived status, message, count per status,
 * the Not reached list, and every recipient filtered by `?status=`. Render
 * inside `<Suspense>`.
 */
export async function BroadcastReport({ params, searchParams }: BroadcastReportProps) {
  const [{ id }, { status: statusParam }] = await Promise.all([params, searchParams]);
  await requireOfficer();

  const [broadcast, rows] = await loadReport(id);
  if (!broadcast) notFound();

  const recipients: ReportRecipient[] = rows.map(({ member, ...row }) => ({
    ...row,
    zoneName: member?.zone.name ?? null,
  }));
  const counts = emptyStatusCounts();
  for (const recipient of recipients) counts[recipient.status] += 1;
  const status = deriveBroadcastStatus(counts);
  const notReached = recipients
    .filter((recipient) => recipient.status === "FAILED" || recipient.status === "SKIPPED")
    .sort(byZoneThenName);

  const filter = parseStatus(statusParam);
  const shown = filter ? recipients.filter((recipient) => recipient.status === filter) : recipients;

  return (
    <>
      <BroadcastSummary
        id={id}
        status={status}
        content={broadcast.content}
        createdAt={broadcast.createdAt}
        alert={broadcast.alert}
        retryOf={broadcast.retryOf}
        notReachedCount={notReached.length}
      />

      <NotReachedPanel recipients={notReached} sending={status === "SENDING"} />

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Delivery</h2>
          </CardTitle>
          <CardDescription>
            {recipients.length} {recipients.length === 1 ? "recipient" : "recipients"}. Statuses update as UniSMS
            reports delivery; press Refresh status if they don&rsquo;t.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatusFilter broadcastId={id} counts={counts} current={filter} />
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filter ? (
              <>
                Showing {RECIPIENT_STATUS_DISPLAY[filter].label.toLowerCase()} ({shown.length}) ·{" "}
                <Link href={`/broadcasts/${id}`} scroll={false} className="text-primary hover:underline">
                  Show all
                </Link>
              </>
            ) : (
              "Showing all recipients. Choose a status above to filter."
            )}
          </p>
          {shown.length > 0 && <RecipientTable recipients={shown} />}
        </CardContent>
      </Card>
    </>
  );
}
