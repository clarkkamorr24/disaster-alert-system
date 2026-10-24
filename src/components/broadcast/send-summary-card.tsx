import { Send } from "lucide-react";
import type { ReactNode } from "react";

import { SmsPreview } from "@/components/alerts/sms-preview";
import { Button } from "@/components/ui/button";

interface SendSummaryCardProps {
  memberCount: number;
  /** Rows above the cost, such as the alert (or what the broadcast is about) and the zones. */
  rows: { label: string; value: string }[];
  totalCredits: number;
  /** `null` when the balance couldn't be read. */
  balance: number | null;
  /** Shown as the sender in the SMS preview. */
  senderId: string;
  /** The final SMS with the prefix, or `""`. */
  text: string;
  /** Why Review and send is disabled, or `null` when it can be pressed. */
  blockedReason: string | null;
  pending: boolean;
  onReview: () => void;
  /** Extra buttons under Review and send, such as Log alert without SMS. */
  children?: ReactNode;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{children}</span>
    </div>
  );
}

/** The sticky Summary next to a send form: recipients, cost, preview, and Review and send. */
export function SendSummaryCard({
  memberCount,
  rows,
  totalCredits,
  balance,
  senderId,
  text,
  blockedReason,
  pending,
  onReview,
  children,
}: SendSummaryCardProps) {
  const format = (n: number) => n.toLocaleString("en-US");
  const overBalance = balance !== null && totalCredits > balance;

  return (
    <section
      aria-labelledby="send-summary-heading"
      className="sticky top-[84px] flex min-w-0 flex-[2_1_300px] flex-col gap-4 rounded-xl border bg-card p-[22px]"
    >
      <h2 id="send-summary-heading" className="font-heading text-base font-bold tracking-[-0.03em]">
        Summary
      </h2>
      <p className="flex items-baseline gap-2">
        <span className="font-heading text-4xl font-bold tracking-[-0.03em] tabular-nums">{format(memberCount)}</span>
        <span className="text-sm text-muted-foreground">{memberCount === 1 ? "recipient" : "recipients"}</span>
      </p>
      <div className="flex flex-col gap-2 text-[13px]">
        {rows.map((row) => (
          <Row key={row.label} label={row.label}>
            {row.value}
          </Row>
        ))}
        <Row label="SMS to queue">
          {format(totalCredits)} {totalCredits === 1 ? "credit" : "credits"}
        </Row>
        <Row label="Balance">
          <span className={overBalance ? "text-destructive" : undefined}>
            {balance === null ? "Unavailable" : `${format(balance)} credits`}
          </span>
        </Row>
      </div>
      <SmsPreview text={text} senderId={senderId} />
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={blockedReason !== null || pending}
          aria-describedby={blockedReason ? "send-blocked-reason" : undefined}
          onClick={onReview}
          className="h-11 gap-2 text-[13px]"
        >
          <Send className="size-4" aria-hidden="true" />
          Review and send
        </Button>
        {blockedReason && (
          <p id="send-blocked-reason" className="text-xs text-muted-foreground">
            {blockedReason}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
