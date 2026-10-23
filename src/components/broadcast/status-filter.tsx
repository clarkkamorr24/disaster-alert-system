import Link from "next/link";

import { RECIPIENT_STATUS_DISPLAY } from "@/components/broadcast/recipient-status-badge";
import { RecipientStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface StatusFilterProps {
  broadcastId: string;
  counts: Record<RecipientStatus, number>;
  /** The status the table shows, or `null` for every recipient. */
  current: RecipientStatus | null;
}

/** One tile per delivery status with its count; each tile filters the recipient table to that status. */
export function StatusFilter({ broadcastId, counts, current }: StatusFilterProps) {
  const base = `/broadcasts/${broadcastId}`;

  return (
    <nav aria-label="Filter recipients by status">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.values(RecipientStatus).map((status) => {
          const { label, icon: Icon, className } = RECIPIENT_STATUS_DISPLAY[status];
          const active = status === current;
          return (
            <li key={status}>
              <Link
                href={active ? base : `${base}?status=${status}`}
                scroll={false}
                aria-current={active ? "true" : undefined}
                className="flex min-h-11 flex-col gap-1 rounded-lg border p-3 hover:bg-muted aria-[current=true]:border-primary aria-[current=true]:bg-primary/5 aria-[current=true]:ring-1 aria-[current=true]:ring-primary"
              >
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon className={cn("size-4", className)} aria-hidden="true" />
                  {label}
                </span>
                <span className="text-2xl font-semibold tabular-nums">{counts[status]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
