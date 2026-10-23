import { Phone } from "lucide-react";

import { RecipientStatusBadge } from "@/components/broadcast/recipient-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPhoneForDisplay } from "@/lib/domain/phone";
import type { ReportRecipient } from "@/types/broadcast";

/** A tap-to-call link for a recipient's phone. */
export function PhoneLink({ phone }: { phone: string }) {
  return (
    <a
      href={`tel:${phone}`}
      className="inline-flex min-h-11 items-center gap-2 self-start tabular-nums text-primary hover:underline"
    >
      <Phone className="size-4" aria-hidden="true" />
      {formatPhoneForDisplay(phone)}
    </a>
  );
}

/** Every recipient with zone, phone, status, and reason: a table from `md` up, cards below. */
export function RecipientTable({ recipients }: { recipients: ReportRecipient[] }) {
  return (
    <>
      <div className="hidden rounded-xl border md:block">
        <Table className="text-base">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Zone</TableHead>
              <TableHead className="px-4">Phone</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="px-4">Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipients.map((recipient) => (
              <TableRow key={recipient.id}>
                <TableCell className="px-4 py-1 font-medium">{recipient.name}</TableCell>
                <TableCell className="px-4 py-1">{recipient.zoneName ?? "—"}</TableCell>
                <TableCell className="px-4 py-1">
                  <PhoneLink phone={recipient.phone} />
                </TableCell>
                <TableCell className="px-4 py-1">
                  <RecipientStatusBadge status={recipient.status} />
                </TableCell>
                <TableCell className="max-w-64 px-4 py-1 whitespace-normal text-muted-foreground">
                  {recipient.failReason ?? ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {recipients.map((recipient) => (
          <li key={recipient.id} className="flex flex-col gap-1 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate font-medium">{recipient.name}</span>
              <RecipientStatusBadge status={recipient.status} />
            </div>
            <span className="text-sm text-muted-foreground">{recipient.zoneName ?? "—"}</span>
            <PhoneLink phone={recipient.phone} />
            {recipient.failReason && <span className="text-sm text-muted-foreground">{recipient.failReason}</span>}
          </li>
        ))}
      </ul>
    </>
  );
}
