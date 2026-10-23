import { PhoneOff } from "lucide-react";

import { RecipientStatusBadge } from "@/components/broadcast/recipient-status-badge";
import { PhoneLink } from "@/components/broadcast/recipient-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportRecipient } from "@/types/broadcast";

interface NotReachedPanelProps {
  /** Failed and skipped recipients, sorted by zone then name. */
  recipients: ReportRecipient[];
  /** Whether messages are still pending or retrying, so more may fail. */
  sending: boolean;
}

/** The members the broadcast didn't reach, with tap-to-call numbers so officers can phone them. */
export function NotReachedPanel({ recipients, sending }: NotReachedPanelProps) {
  const count = recipients.length;

  return (
    <Card className={count > 0 ? "ring-destructive/40" : undefined}>
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <PhoneOff className="size-5 text-destructive" aria-hidden="true" />
            Not reached ({count})
          </h2>
        </CardTitle>
        <CardDescription>
          {count > 0
            ? "Call these members directly, or resend to them."
            : sending
              ? "Nobody so far. Pending messages may still fail."
              : "Every member was reached."}
        </CardDescription>
      </CardHeader>
      {count > 0 && (
        <CardContent>
          <ul className="flex flex-col divide-y">
            {recipients.map((recipient) => (
              <li key={recipient.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-medium">{recipient.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {recipient.zoneName ?? "—"}
                    {recipient.failReason && ` · ${recipient.failReason}`}
                  </span>
                </div>
                <RecipientStatusBadge status={recipient.status} />
                <PhoneLink phone={recipient.phone} />
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
