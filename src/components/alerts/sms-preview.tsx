import { Skeleton } from "@/components/ui/skeleton";

/**
 * The SMS as members will receive it, in a gray bubble labeled with the prefix.
 * `text` is `null` while it can't be shown yet, such as before the clock is read.
 */
export function SmsPreview({ text, prefix }: { text: string | null; prefix: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-muted px-3.5 py-3">
      <p className="text-[10px] font-bold tracking-[.06em] text-muted-foreground uppercase">SMS preview · {prefix.replace(/:$/, "")}</p>
      {text === null ? (
        <Skeleton className="h-5 w-56 max-w-full" />
      ) : (
        <p className="text-[13px] leading-normal break-words whitespace-pre-wrap">
          {text === "" ? <span className="text-muted-foreground">The message appears here.</span> : text}
        </p>
      )}
    </div>
  );
}
