import { CircleCheck, CircleX, Clock, TriangleAlert, type LucideIcon } from "lucide-react";

import { BROADCAST_STATUS_LABELS } from "@/lib/broadcast/status";
import { cn } from "@/lib/utils";
import type { BroadcastStatus } from "@/types/broadcast";

const DISPLAY: Record<BroadcastStatus, { icon: LucideIcon; className: string }> = {
  SENDING: { icon: Clock, className: "text-muted-foreground" },
  COMPLETED: { icon: CircleCheck, className: "text-green-700 dark:text-green-400" },
  PARTIAL: { icon: TriangleAlert, className: "text-orange-600 dark:text-orange-400" },
  FAILED: { icon: CircleX, className: "text-destructive" },
};

/** A broadcast's derived status as its colored icon plus the label text. */
export function BroadcastStatusBadge({ status }: { status: BroadcastStatus }) {
  const { icon: Icon, className } = DISPLAY[status];
  return (
    <span className="inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border bg-background px-2 text-sm font-medium whitespace-nowrap">
      <Icon className={cn("size-4", className)} aria-hidden="true" />
      {BROADCAST_STATUS_LABELS[status]}
    </span>
  );
}
