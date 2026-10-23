import { SMS_MAX_CHARS } from "@/lib/domain/sms-text";
import { cn } from "@/lib/utils";

interface ComposePreviewProps {
  /** The final text with the prefix, or `""` while the message is empty. */
  text: string;
  creditsPerMember: number;
  memberCount: number;
  /** `null` when the balance couldn't be read. */
  balance: number | null;
}

function plural(count: number, word: string): string {
  return `${count.toLocaleString("en-PH")} ${word}${count === 1 ? "" : "s"}`;
}

/** The message as members will receive it, with its length, cost, and the credit balance. */
export function ComposePreview({ text, creditsPerMember, memberCount, balance }: ComposePreviewProps) {
  const total = creditsPerMember * memberCount;
  const overBalance = balance !== null && total > balance;

  return (
    <section aria-labelledby="compose-preview-heading" className="flex flex-col gap-2">
      <h2 id="compose-preview-heading" className="text-sm leading-none font-medium">
        Preview
      </h2>
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4">
        <div className="max-w-sm self-start rounded-2xl rounded-bl-sm bg-card px-4 py-3 text-base whitespace-pre-wrap break-words shadow-sm ring-1 ring-border">
          {text === "" ? <span className="text-muted-foreground">Type a message to see the preview.</span> : text}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm tabular-nums">
          <dt className="text-muted-foreground">Length</dt>
          <dd className={cn(text.length > SMS_MAX_CHARS && "font-medium text-destructive")}>
            {text.length} / {SMS_MAX_CHARS} characters
          </dd>
          <dt className="text-muted-foreground">Cost</dt>
          <dd>
            {plural(creditsPerMember, "credit")} per member × {plural(memberCount, "member")} ={" "}
            <span className="font-medium">{plural(total, "credit")}</span>
          </dd>
          <dt className="text-muted-foreground">Balance</dt>
          <dd className={cn(overBalance && "font-medium text-destructive")}>
            {balance === null ? "Balance unavailable" : plural(balance, "credit")}
          </dd>
        </dl>
      </div>
    </section>
  );
}
