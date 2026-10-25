"use client";

import { Filter } from "lucide-react";
import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEVERITIES } from "@/lib/domain/hazards";
import { zoneListHref } from "@/lib/zones/list-filters";
import type { ZoneListFilters, ZoneListStatus } from "@/types/zone";

const ITEMS: { value: ZoneListStatus | null; label: string }[] = [
  { value: null, label: "All statuses" },
  ...(["CRITICAL", "HIGH", "MODERATE", "LOW"] as const).map((value) => ({ value, label: SEVERITIES[value].label })),
  { value: "CLEAR", label: "Clear" },
];

/**
 * The status select of the zones toolbar: goes to `/zones` with the chosen
 * worst severity (or Clear) in the URL, keeping the search and view.
 */
export function ZoneStatusFilter({ filters }: { filters: ZoneListFilters }) {
  const router = useRouter();

  return (
    <Select
      items={ITEMS}
      value={filters.status}
      onValueChange={(value) =>
        router.push(zoneListHref({ ...filters, status: value as ZoneListStatus | null }), { scroll: false })
      }
    >
      <SelectTrigger
        aria-label="Filter by status"
        className="h-11 gap-[7px] rounded-lg border-input bg-card px-3 text-xs font-semibold text-control-foreground data-[size=default]:h-11 sm:h-[39px] sm:data-[size=default]:h-[39px]"
      >
        <Filter className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ITEMS.map((item) => (
          <SelectItem key={item.value ?? "all"} value={item.value} className="min-h-11 sm:min-h-9">
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
