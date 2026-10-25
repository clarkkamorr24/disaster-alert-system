import { StatusText } from "@/components/layout/status-pill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RECIPIENT_STATUS_DISPLAY } from "@/lib/broadcast/status";
import { formatRelativeManila } from "@/lib/datetime";
import { formatPhoneForDisplay } from "@/lib/domain/phone";
import type { ReportRecipient } from "@/types/broadcast";

const HEAD_CLASS = "sticky top-0 z-10 shadow-[inset_0_-1px_0_var(--row-border)]";

interface RecipientTableProps {
  recipients: ReportRecipient[];
  /** For `Today` / `Yesterday` in the Updated column. */
  now: Date;
}

/**
 * The report's recipients with tap-to-call numbers, zone, status (with the
 * reason for failed and skipped), attempts, and when the status last
 * changed. Scrolls inside a 440px area under a sticky header.
 */
export function RecipientTable({ recipients, now }: RecipientTableProps) {
  if (recipients.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">No recipients in this view.</p>;
  }

  return (
    <Table className="min-w-[760px]" containerClassName="max-h-[440px] overflow-y-auto">
      <TableHeader className="[&_tr]:border-b-0">
        <TableRow className="hover:bg-transparent">
          <TableHead className={HEAD_CLASS}>Recipient</TableHead>
          <TableHead className={HEAD_CLASS}>Mobile</TableHead>
          <TableHead className={HEAD_CLASS}>Zone</TableHead>
          <TableHead className={HEAD_CLASS}>Status</TableHead>
          <TableHead className={HEAD_CLASS}>Attempts</TableHead>
          <TableHead className={HEAD_CLASS}>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recipients.map((recipient) => {
          const { label, tone } = RECIPIENT_STATUS_DISPLAY[recipient.status];
          const showReason = (recipient.status === "FAILED" || recipient.status === "SKIPPED") && recipient.failReason;
          return (
            <TableRow key={recipient.id}>
              <TableCell className="h-[52px] font-semibold text-title-foreground">{recipient.name}</TableCell>
              <TableCell>
                <a
                  href={`tel:${recipient.phone}`}
                  className="inline-flex min-h-11 items-center font-semibold text-link tabular-nums hover:text-primary-hover hover:underline"
                >
                  {formatPhoneForDisplay(recipient.phone)}
                </a>
              </TableCell>
              <TableCell>{recipient.zoneName ?? "—"}</TableCell>
              <TableCell>
                <span className="flex flex-col gap-0.5">
                  <StatusText tone={tone}>{label}</StatusText>
                  {showReason && (
                    <small className="max-w-64 text-[13px] whitespace-normal text-subtle-foreground">
                      {recipient.failReason}
                    </small>
                  )}
                </span>
              </TableCell>
              <TableCell className="tabular-nums">{recipient.attempts}</TableCell>
              <TableCell>{formatRelativeManila(recipient.updatedAt, now)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
