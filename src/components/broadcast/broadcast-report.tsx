import { notFound } from "next/navigation";

import { BroadcastSummary } from "@/components/broadcast/broadcast-summary";
import { DeliveryBar } from "@/components/broadcast/delivery-bar";
import { RecipientTable } from "@/components/broadcast/recipient-table";
import { StatusTiles } from "@/components/broadcast/status-tiles";
import { SegmentedLinks } from "@/components/layout/segmented-control";
import { requireOfficer } from "@/lib/auth/dal";
import { loadAttempts } from "@/lib/broadcast/attempts";
import { deliveryBreakdown, deriveBroadcastStatus, emptyStatusCounts } from "@/lib/broadcast/status";
import { broadcastTitle } from "@/lib/broadcast/title";
import { prisma } from "@/lib/db";
import { zonesLabel } from "@/lib/domain/zones-label";
import { getEnv } from "@/lib/env";
import type { ReportRecipient, ReportView } from "@/types/broadcast";

interface BroadcastReportProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const VIEW_LABELS: Record<ReportView, string> = { all: "All", unreached: "Not reached", pending: "Pending" };

function parseView(value: string | string[] | undefined): ReportView {
  return value === "unreached" || value === "pending" ? value : "all";
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
        creditsPerRecipient: true,
        alert: { select: { id: true, title: true } },
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
        updatedAt: true,
        member: { select: { zone: { select: { name: true } } } },
      },
    }),
    loadAttempts(id),
    prisma.farmZone.count(),
  ]);
}

/** Splits the recipients into the three views; Not reached is sorted by zone then name. */
function viewRecipients(recipients: ReportRecipient[]): Record<ReportView, ReportRecipient[]> {
  return {
    all: recipients,
    unreached: recipients.filter((r) => r.status === "FAILED" || r.status === "SKIPPED").sort(byZoneThenName),
    pending: recipients.filter((r) => r.status === "PENDING" || r.status === "RETRYING"),
  };
}

/**
 * A broadcast's delivery report in one card: header with the live indicator
 * and actions, progress bar, status tiles, the message, and the recipients
 * of the `?view=` tab. Render inside `<Suspense>`.
 */
export async function BroadcastReport({ params, searchParams }: BroadcastReportProps) {
  const [{ id }, { view: viewParam }] = await Promise.all([params, searchParams]);
  await requireOfficer();

  const [broadcast, rows, attempts, totalZones] = await loadReport(id);
  if (!broadcast) notFound();

  const recipients: ReportRecipient[] = rows.map(({ member, ...row }) => ({
    ...row,
    zoneName: member?.zone.name ?? null,
    attempts: attempts.get(row.phone) ?? 1,
  }));
  const counts = emptyStatusCounts();
  for (const recipient of recipients) counts[recipient.status] += 1;
  const delivery = deliveryBreakdown(counts);
  const views = viewRecipients(recipients);
  const view = parseView(viewParam);
  const zoneNames = [...new Set(recipients.flatMap((r) => (r.zoneName ? [r.zoneName] : [])))];
  const credits = broadcast.creditsPerRecipient;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-5 p-5">
        <BroadcastSummary
          id={id}
          title={broadcastTitle({
            alertTitle: broadcast.alert?.title ?? null,
            content: broadcast.content,
            prefix: getEnv().SMS_MESSAGE_PREFIX,
          })}
          status={deriveBroadcastStatus(counts)}
          createdAt={broadcast.createdAt}
          zones={zonesLabel(zoneNames, totalZones)}
          recipientCount={recipients.length}
          alert={broadcast.alert}
          retryOf={broadcast.retryOf}
          notReachedCount={delivery.notReached}
          live={delivery.pending > 0}
        />
        <DeliveryBar {...delivery} className="h-1.5 w-full" />
        <StatusTiles counts={counts} />
        <section aria-labelledby="broadcast-message-heading" className="flex flex-col gap-2">
          <h2
            id="broadcast-message-heading"
            className="text-[13px] font-bold tracking-[.06em] text-muted-foreground uppercase"
          >
            Message
          </h2>
          <p className="max-w-xl rounded-xl rounded-bl-sm bg-muted px-3.5 py-3 text-[13px] leading-normal break-words whitespace-pre-wrap">
            {broadcast.content}
          </p>
          <p className="text-xs text-muted-foreground">
            {credits} {credits === 1 ? "credit" : "credits"} per member
          </p>
        </section>
        <SegmentedLinks
          label="Recipients"
          links={(Object.keys(VIEW_LABELS) as ReportView[]).map((key) => ({
            href: key === "all" ? `/broadcasts/${id}` : `/broadcasts/${id}?view=${key}`,
            label: VIEW_LABELS[key],
            count: views[key].length,
            current: key === view,
          }))}
        />
      </div>
      <div className="border-t">
        <RecipientTable recipients={views[view]} now={new Date()} />
      </div>
    </article>
  );
}
