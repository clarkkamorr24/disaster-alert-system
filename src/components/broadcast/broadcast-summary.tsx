import { Ban, CircleCheck, CircleX, Clock, RefreshCw, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { HazardBadge } from "@/components/alerts/hazard-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipientStatus } from "@/generated/prisma/enums";
import { requireOfficer } from "@/lib/auth/dal";
import { formatManilaDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

interface BroadcastSummaryProps {
  params: Promise<{ id: string }>;
}

const STATUS_DISPLAY: Record<RecipientStatus, { label: string; icon: LucideIcon; className: string }> = {
  PENDING: { label: "Pending", icon: Clock, className: "text-muted-foreground" },
  RETRYING: { label: "Retrying", icon: RefreshCw, className: "text-amber-600 dark:text-amber-400" },
  SENT: { label: "Sent", icon: CircleCheck, className: "text-green-700 dark:text-green-400" },
  FAILED: { label: "Failed", icon: CircleX, className: "text-destructive" },
  SKIPPED: { label: "Skipped", icon: Ban, className: "text-orange-600 dark:text-orange-400" },
};

/** The message, time, alert, and count per delivery status of one broadcast. Render inside `<Suspense>`. */
export async function BroadcastSummary({ params }: BroadcastSummaryProps) {
  const { id } = await params;
  await requireOfficer();

  const [broadcast, groups] = await Promise.all([
    prisma.broadcast.findUnique({
      where: { id },
      select: {
        content: true,
        createdAt: true,
        alert: { select: { id: true, title: true, hazardType: true } },
      },
    }),
    prisma.broadcastRecipient.groupBy({
      by: ["status"],
      where: { broadcastId: id },
      _count: { _all: true },
    }),
  ]);
  if (!broadcast) notFound();

  const counts = Object.fromEntries(groups.map((group) => [group.status, group._count._all]));
  const total = groups.reduce((sum, group) => sum + group._count._all, 0);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Broadcast</h1>
        <p className="text-muted-foreground">Sent {formatManilaDateTime(broadcast.createdAt)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Message</h2>
          </CardTitle>
          {broadcast.alert && (
            <CardDescription className="flex flex-wrap items-center gap-2">
              About
              <HazardBadge type={broadcast.alert.hazardType} />
              <Link
                href={`/alerts/${broadcast.alert.id}`}
                className="inline-flex min-h-11 items-center font-medium text-foreground hover:underline"
              >
                {broadcast.alert.title}
              </Link>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="max-w-sm rounded-2xl rounded-bl-sm bg-muted/40 px-4 py-3 text-base whitespace-pre-wrap break-words ring-1 ring-border">
            {broadcast.content}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Delivery</h2>
          </CardTitle>
          <CardDescription>
            {total} {total === 1 ? "recipient" : "recipients"}. Pending messages update as UniSMS reports
            delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {Object.values(RecipientStatus).map((status) => {
              const { label, icon: Icon, className } = STATUS_DISPLAY[status];
              return (
                <div key={status} className="flex flex-col gap-1 rounded-lg border p-3">
                  <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon className={cn("size-4", className)} aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="text-2xl font-semibold tabular-nums">{counts[status] ?? 0}</dd>
                </div>
              );
            })}
          </dl>
        </CardContent>
      </Card>
    </>
  );
}

/** Placeholder while {@link BroadcastSummary} loads. */
export function BroadcastSummarySkeleton() {
  return (
    <>
      <Skeleton className="h-16 w-64" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
    </>
  );
}
