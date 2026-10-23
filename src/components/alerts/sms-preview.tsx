/** The SMS as members will receive it, in a gray bubble labeled with the prefix. */
export function SmsPreview({ text, prefix }: { text: string; prefix: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-muted px-3.5 py-3">
      <p className="text-[10px] font-bold tracking-[.06em] text-muted-foreground uppercase">SMS preview · {prefix.replace(/:$/, "")}</p>
      <p className="text-[13px] leading-normal break-words whitespace-pre-wrap">
        {text === "" ? <span className="text-muted-foreground">The message appears here.</span> : text}
      </p>
    </div>
  );
}
