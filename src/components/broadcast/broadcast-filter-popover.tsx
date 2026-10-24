"use client";

import { Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { broadcastListHref } from "@/lib/broadcast/list-filters";
import type { BroadcastKind, BroadcastListFilters } from "@/types/broadcast";

const KIND_ITEMS: { value: BroadcastKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "alert", label: "About an alert" },
  { value: "announcement", label: "Announcement" },
  { value: "resend", label: "Resend" },
];

/** The Filter button and its popover with the broadcast kind. Applying puts it in the URL, back on page 1. */
export function BroadcastFilterPopover({ filters }: { filters: BroadcastListFilters }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(filters.kind);

  function openChange(next: boolean) {
    // Each opening starts from what the URL has, not from an unapplied choice.
    if (next) setKind(filters.kind);
    setOpen(next);
  }

  function apply(next: BroadcastKind) {
    setOpen(false);
    router.push(broadcastListHref({ ...filters, kind: next, page: 1 }));
  }

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger
        render={
          <Button variant="outline" className="h-11 gap-[7px] px-3 text-xs sm:h-[39px]">
            <Filter className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
            Filter
            {filters.kind !== "all" && (
              <span className="grid min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground tabular-nums">
                <span className="sr-only">(</span>1<span className="sr-only"> active)</span>
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-[min(18rem,calc(100vw-32px))] gap-4 p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="broadcast-filter-kind">Kind</Label>
          <Select items={KIND_ITEMS} value={kind} onValueChange={(value) => setKind(value as BroadcastKind)}>
            <SelectTrigger id="broadcast-filter-kind" className="h-11 w-full text-sm data-[size=default]:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="min-h-11">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-11 px-4" onClick={() => apply("all")}>
            Clear
          </Button>
          <Button className="h-11 px-4" onClick={() => apply(kind)}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
