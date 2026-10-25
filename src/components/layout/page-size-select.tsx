"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PageSize } from "@/lib/pagination";

interface PageSizeSelectProps {
  size: PageSize;
  /** Each size with the URL that shows it, back on page 1. */
  options: { size: PageSize; href: string }[];
}

/** "Rows per page" with a select of the sizes; choosing one opens its URL. */
export function PageSizeSelect({ size, options }: PageSizeSelectProps) {
  const router = useRouter();
  const labelId = useId();
  const items = options.map((option) => ({ value: option.size, label: String(option.size) }));

  return (
    <div className="flex items-center gap-2">
      <span id={labelId}>Rows per page</span>
      <Select
        items={items}
        value={size}
        onValueChange={(value) => {
          const option = options.find((o) => o.size === value);
          if (option) router.push(option.href);
        }}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          className="h-11 min-w-[68px] rounded-[7px] px-2.5 text-[13px] font-semibold data-[size=default]:h-11 sm:h-8 sm:data-[size=default]:h-8"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value} className="min-h-11 sm:min-h-8">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
