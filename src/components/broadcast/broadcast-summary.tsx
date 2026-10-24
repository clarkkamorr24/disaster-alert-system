import { Repeat } from "lucide-react";
import Link from "next/link";

import { LiveIndicator } from "@/components/broadcast/live-indicator";
import { RefreshStatusButton } from "@/components/broadcast/refresh-status-button";
import { StatusText } from "@/components/layout/status-pill";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BROADCAST_STATUS_LABELS, BROADCAST_STATUS_TONES } from "@/lib/broadcast/status";
import { formatManilaDateTime } from "@/lib/datetime";
import type { BroadcastStatus } from "@/types/broadcast";

interface BroadcastSummaryProps {
  id: string;
  title: string;
  status: BroadcastStatus;
  createdAt: Date;
  /** From `zonesLabel`. */
  zones: string;
  recipientCount: number;
  alert: { id: string; title: string } | null;
  /** The broadcast this one resent, if any. */
  retryOf: { id: string; createdAt: Date } | null;
  notReachedCount: number;
  /** Whether any recipient is still pending or retrying. */
  live: boolean;
}

const LINK_CLASS =
  "inline-flex min-h-11 items-center font-semibold text-link hover:text-primary-hover hover:underline sm:min-h-0";

/** The top of the report card: title, status, when and to whom, the live indicator, and the actions. */
export function BroadcastSummary({
  id,
  title,
  status,
  createdAt,
  zones,
  recipientCount,
  alert,
  retryOf,
  notReachedCount,
  live,
}: BroadcastSummaryProps) {
  const resendLabel = `Resend to not reached (${notReachedCount.toLocaleString("en-US")})`;
  const recipients = `${recipientCount.toLocaleString("en-US")} ${recipientCount === 1 ? "recipient" : "recipients"}`;

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-heading text-[22px] leading-tight font-bold tracking-[-0.03em] break-words">{title}</h1>
          <StatusText tone={BROADCAST_STATUS_TONES[status]}>{BROADCAST_STATUS_LABELS[status]}</StatusText>
        </div>
        <p className="text-[13px] text-muted-foreground">
          Sent {formatManilaDateTime(createdAt)} · {zones} · {recipients}
        </p>
        {(retryOf || alert) && (
          <p className="flex flex-wrap items-center gap-x-4 text-[13px] text-muted-foreground">
            {retryOf && (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <Repeat className="size-3.5" aria-hidden="true" />
                Resend of
                <Link href={`/broadcasts/${retryOf.id}`} className={LINK_CLASS}>
                  the broadcast of {formatManilaDateTime(retryOf.createdAt)}
                </Link>
              </span>
            )}
            {alert && (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                About
                <Link href={`/alerts/${alert.id}`} className={LINK_CLASS}>
                  {alert.title}
                </Link>
              </span>
            )}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LiveIndicator active={live} />
        <RefreshStatusButton id={id} />
        {notReachedCount > 0 ? (
          <Link
            href={`/broadcasts/new?retryOf=${id}`}
            className={buttonVariants({ className: "h-11 gap-2 px-4 text-[13px]" })}
          >
            <Repeat data-icon="inline-start" />
            {resendLabel}
          </Link>
        ) : (
          <Button disabled className="h-11 gap-2 px-4 text-[13px]">
            <Repeat data-icon="inline-start" />
            {resendLabel}
          </Button>
        )}
      </div>
    </header>
  );
}

/** Placeholder while the broadcast report loads. */
export function BroadcastSummarySkeleton() {
  return <Skeleton className="h-[720px] rounded-xl" />;
}
