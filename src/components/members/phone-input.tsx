import type { ComponentProps } from "react";
import { cn } from "cn";

import { Input } from "@/components/ui/input";

/**
 * A mobile number input with a `+63` box in front. The box is display only:
 * the server normalizes whatever is typed (`917…`, `0917…`, `+63917…`).
 */
export function PhoneInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <div className="flex">
      <span
        aria-hidden="true"
        className="flex h-11 shrink-0 items-center rounded-l-lg border border-r-0 border-input bg-muted px-2.5 text-[13px] text-control-foreground"
      >
        +63
      </span>
      <Input
        type="tel"
        inputMode="tel"
        autoComplete="off"
        placeholder="917 123 4567"
        className={cn("h-11 min-w-0 flex-1 rounded-l-none", className)}
        {...props}
      />
    </div>
  );
}
