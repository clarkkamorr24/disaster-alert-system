import { AudioLines, BatteryFull, ChevronLeft, ChevronRight, Plus, Signal, User, Wifi } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * The SMS as members will receive it, in a phone mockup styled after the iPhone
 * Messages app and headed by the sender ID.
 * `text` is `null` while it can't be shown yet, such as before the clock is read.
 */
export function SmsPreview({ text, senderId }: { text: string | null; senderId: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold tracking-[.06em] text-muted-foreground uppercase">SMS preview</p>
      <div className="mx-auto w-[270px] max-w-full rounded-[44px] bg-phone-frame p-2.5 shadow-lg">
        <div className="flex h-[440px] flex-col overflow-hidden rounded-[34px] bg-sms-screen text-foreground">
          <div aria-hidden="true" className="bg-sms-chrome">
            <div className="relative flex items-center justify-between px-6 pt-3 pb-1 text-[13px] font-semibold">
              <span>9:41</span>
              <span className="absolute top-2 left-1/2 h-5 w-[70px] -translate-x-1/2 rounded-full bg-black" />
              <span className="flex items-center gap-1">
                <Signal className="size-3" />
                <Wifi className="size-3" />
                <BatteryFull className="size-3.5" />
              </span>
            </div>
            <div className="relative flex flex-col items-center gap-1 border-b px-3 pt-1 pb-2">
              <ChevronLeft className="absolute top-3 left-2 size-6 text-sms-accent" strokeWidth={2.25} />
              <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-sms-avatar">
                <User className="mt-2 size-9 fill-white text-white" strokeWidth={1} />
              </span>
              <span className="flex items-center text-[10px]">
                {senderId}
                <ChevronRight className="size-3 text-muted-foreground" />
              </span>
            </div>
          </div>
          {/* Focusable so keyboard users can scroll a long message. */}
          <div
            tabIndex={0}
            role="region"
            aria-label="SMS preview"
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <p className="text-center text-[10px] leading-tight text-muted-foreground">
              Text Message · SMS
              <br />
              Today 9:41 AM
            </p>
            {text === null ? (
              <Skeleton className="h-9 w-40 rounded-2xl" />
            ) : (
              // The tail: a bubble-colored corner, cut by a screen-colored curve beside it.
              <p className="relative ml-1.5 max-w-[80%] self-start rounded-[18px] bg-sms-bubble px-3 py-1.5 text-[13px] leading-snug break-words whitespace-pre-wrap before:absolute before:bottom-0 before:-left-[7px] before:h-4 before:w-5 before:rounded-br-[16px_14px] before:bg-sms-bubble after:absolute after:bottom-0 after:-left-2.5 after:h-4 after:w-2.5 after:rounded-br-[10px] after:bg-sms-screen">
                {text === "" ? <span className="text-muted-foreground">The message appears here.</span> : text}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 px-2.5 pt-1.5">
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-sms-chrome">
              <Plus className="size-4 text-muted-foreground" />
            </span>
            <p className="flex h-8 min-w-0 flex-1 items-center justify-between rounded-full border px-3 text-xs text-muted-foreground">
              Text Message · SMS
              <AudioLines aria-hidden="true" className="size-3.5 shrink-0 text-sms-mic" />
            </p>
          </div>
          <span aria-hidden="true" className="mx-auto mt-2 mb-1.5 h-1 w-24 shrink-0 rounded-full bg-foreground" />
        </div>
      </div>
    </div>
  );
}
