import { Send } from "lucide-react";
import type { ReactNode } from "react";

import { SmsPreview } from "@/components/alerts/sms-preview";
import { Button } from "@/components/ui/button";

interface AlertSummaryCardProps {
  memberCount: number;
  /** `Hazard · Severity`, or `—` while either is missing. */
  alertLabel: string;
  zonesLabel: string;
  totalCredits: number;
  /** `null` when the balance couldn't be read. */
  balance: number | null;
  prefix: string;
  /** The final SMS with the prefix, or `""`. */
  text: string;
  /** Why Review and send is disabled, or `null` when it can be pressed. */
  blockedReason: string | null;
  pending: boolean;
  onReview: () => void;
  onLogOnly: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{children}</span>
    </div>
  );
}

/** The sticky Summary next to the New alert form: recipients, cost, preview, and the two submit buttons. */
export function AlertSummaryCard({
  memberCount,
  alertLabel,
  zonesLabel,
  totalCredits,
  balance,
  prefix,
  text,
  blockedReason,
  pending,
  onReview,
  onLogOnly,
}: AlertSummaryCardProps) {
  const format = (n: number) => n.toLocaleString("en-US");
  const overBalance = balance !== null && totalCredits > balance;

  return (
    <section
      aria-labelledby="alert-summary-heading"
      className="sticky top-[84px] flex min-w-0 flex-[2_1_300px] flex-col gap-4 rounded-xl border bg-card p-[22px]"
    >
      <h2 id="alert-summary-heading" className="font-heading text-base font-bold tracking-[-0.03em]">
        Summary
      </h2>
      <p className="flex items-baseline gap-2">
        <span className="font-heading text-4xl font-bold tracking-[-0.03em] tabular-nums">{format(memberCount)}</span>
        <span className="text-sm text-muted-foreground">{memberCount === 1 ? "recipient" : "recipients"}</span>
      </p>
      <div className="flex flex-col gap-2 text-[13px]">
        <Row label="Alert">{alertLabel}</Row>
        <Row label="Zones">{zonesLabel}</Row>
        <Row label="SMS to queue">
          {format(totalCredits)} {totalCredits === 1 ? "credit" : "credits"}
        </Row>
        <Row label="Balance">
          <span className={overBalance ? "text-destructive" : undefined}>
            {balance === null ? "Unavailable" : `${format(balance)} credits`}
          </span>
        </Row>
      </div>
      <SmsPreview text={text} prefix={prefix} />
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          disabled={blockedReason !== null || pending}
          aria-describedby={blockedReason ? "alert-send-blocked" : undefined}
          onClick={onReview}
          className="h-11 gap-2 text-[13px]"
        >
          <Send className="size-4" aria-hidden="true" />
          Review and send
        </Button>
        {blockedReason && (
          <p id="alert-send-blocked" className="text-xs text-muted-foreground">
            {blockedReason}
          </p>
        )}
        <Button type="button" variant="outline" disabled={pending} onClick={onLogOnly} className="h-11 text-[13px]">
          {pending ? "Saving…" : "Log alert without SMS"}
        </Button>
      </div>
    </section>
  );
}
