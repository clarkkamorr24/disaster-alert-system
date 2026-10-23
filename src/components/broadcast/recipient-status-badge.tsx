import { Ban, CircleCheck, CircleX, Clock, RefreshCw, type LucideIcon } from "lucide-react";

import type { RecipientStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

/** How each recipient status is shown: label, icon, and icon color. */
export const RECIPIENT_STATUS_DISPLAY: Record<RecipientStatus, { label: string; icon: LucideIcon; className: string }> =
  {
    PENDING: { label: "Pending", icon: Clock, className: "text-muted-foreground" },
    RETRYING: { label: "Retrying", icon: RefreshCw, className: "text-amber-600 dark:text-amber-400" },
    SENT: { label: "Sent", icon: CircleCheck, className: "text-green-700 dark:text-green-400" },
    FAILED: { label: "Failed", icon: CircleX, className: "text-destructive" },
    SKIPPED: { label: "Skipped", icon: Ban, className: "text-orange-600 dark:text-orange-400" },
  };

/** A recipient's delivery status as its colored icon plus the label text. */
export function RecipientStatusBadge({ status }: { status: RecipientStatus }) {
  const { label, icon: Icon, className } = RECIPIENT_STATUS_DISPLAY[status];
  return (
    <span className="inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border bg-background px-2 text-sm font-medium whitespace-nowrap">
      <Icon className={cn("size-4", className)} aria-hidden="true" />
      {label}
    </span>
  );
}
