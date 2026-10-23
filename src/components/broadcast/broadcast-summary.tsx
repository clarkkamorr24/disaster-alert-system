import { Repeat } from "lucide-react";
import Link from "next/link";

import { HazardBadge } from "@/components/alerts/hazard-badge";
import { BroadcastStatusBadge } from "@/components/broadcast/broadcast-status-badge";
import { RefreshStatusButton } from "@/components/broadcast/refresh-status-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HazardType } from "@/generated/prisma/enums";
import { formatManilaDateTime } from "@/lib/datetime";
import type { BroadcastStatus } from "@/types/broadcast";

interface BroadcastSummaryProps {
  id: string;
  status: BroadcastStatus;
  content: string;
  createdAt: Date;
  alert: { id: string; title: string; hazardType: HazardType } | null;
  /** The broadcast this one resent, if any. */
  retryOf: { id: string; createdAt: Date } | null;
  notReachedCount: number;
}

/** A broadcast's status, time, actions, and message. */
export function BroadcastSummary({
  id,
  status,
  content,
  createdAt,
  alert,
  retryOf,
  notReachedCount,
}: BroadcastSummaryProps) {
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">Broadcast</h1>
            <BroadcastStatusBadge status={status} />
          </div>
          <p className="text-muted-foreground">Sent {formatManilaDateTime(createdAt)}</p>
          {retryOf && (
            <p className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
              <Repeat className="size-4" aria-hidden="true" />
              Resend to the members not reached by
              <Link href={`/broadcasts/${retryOf.id}`} className="inline-flex min-h-11 items-center text-primary hover:underline">
                the broadcast of {formatManilaDateTime(retryOf.createdAt)}
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshStatusButton id={id} />
          {notReachedCount > 0 ? (
            <Link
              href={`/broadcasts/new?retryOf=${id}`}
              className={buttonVariants({ className: "h-11 px-4 text-base" })}
            >
              <Repeat data-icon="inline-start" />
              Resend to not reached
            </Link>
          ) : (
            <Button disabled className="h-11 px-4 text-base">
              <Repeat data-icon="inline-start" />
              Resend to not reached
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">Message</h2>
          </CardTitle>
          {alert && (
            <CardDescription className="flex flex-wrap items-center gap-2">
              About
              <HazardBadge type={alert.hazardType} />
              <Link
                href={`/alerts/${alert.id}`}
                className="inline-flex min-h-11 items-center font-medium text-foreground hover:underline"
              >
                {alert.title}
              </Link>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="max-w-sm rounded-2xl rounded-bl-sm bg-muted/40 px-4 py-3 text-base whitespace-pre-wrap break-words ring-1 ring-border">
            {content}
          </p>
        </CardContent>
      </Card>
    </>
  );
}

/** Placeholder while the broadcast report loads. */
export function BroadcastSummarySkeleton() {
  return (
    <>
      <Skeleton className="h-28 w-72" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </>
  );
}
