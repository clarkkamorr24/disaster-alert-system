import { BatteryFull, Signal, Wifi } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * The SMS as members will receive it, in a phone mockup headed by the sender ID.
 * `text` is `null` while it can't be shown yet, such as before the clock is read.
 */
export function SmsPreview({ text, senderId }: { text: string | null; senderId: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold tracking-[.06em] text-muted-foreground uppercase">SMS preview</p>
      <div className="mx-auto w-[270px] max-w-full rounded-[44px] bg-phone-frame p-2.5 shadow-lg">
        <div className="flex h-[400px] flex-col overflow-hidden rounded-[34px] bg-muted">
          <div aria-hidden="true" className="relative flex items-center justify-between bg-card px-6 pt-3 pb-2 text-[13px] font-semibold">
            <span>9:41</span>
            <span className="absolute top-2 left-1/2 h-5 w-[70px] -translate-x-1/2 rounded-full bg-phone-frame" />
            <span className="flex items-center gap-1">
              <Signal className="size-3" />
              <Wifi className="size-3" />
              <BatteryFull className="size-3.5" />
            </span>
          </div>
          <p className="border-b bg-card pt-1 pb-3 text-center text-sm font-semibold">{senderId}</p>
          {/* Focusable so keyboard users can scroll a long message. */}
          <div
            tabIndex={0}
            role="region"
            aria-label="SMS preview"
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <p className="text-center text-[10px] text-muted-foreground">Text Message · Today 9:41 AM</p>
            {text === null ? (
              <Skeleton className="h-9 w-40 rounded-2xl" />
            ) : (
              <p className="max-w-[85%] self-start rounded-2xl bg-sms-bubble px-3 py-2 text-[13px] leading-normal break-words whitespace-pre-wrap">
                {text === "" ? <span className="text-muted-foreground">The message appears here.</span> : text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
