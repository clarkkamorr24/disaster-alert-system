"use client";

import { Filter } from "lucide-react";
import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { memberListHref } from "@/lib/members/list-filters";
import type { MemberListFilters, MemberStatusFilter, ZoneOption } from "@/types/member";

const STATUS_ITEMS: { value: MemberStatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

const TRIGGER_CLASS =
  "h-11 gap-[7px] rounded-lg border-input bg-card px-3 text-xs font-semibold text-control-foreground data-[size=default]:h-11 sm:h-[39px] sm:data-[size=default]:h-[39px]";

interface MemberFiltersProps {
  filters: MemberListFilters;
  zones: ZoneOption[];
}

/**
 * The zone and status selects of the members toolbar. Choosing one goes to
 * `/members` with it in the URL, keeping the search, back on page 1.
 */
export function MemberFilters({ filters, zones }: MemberFiltersProps) {
  const router = useRouter();
  const zoneItems = [
    { value: null, label: "Filter: all zones" },
    ...zones.map((zone) => ({ value: zone.id, label: zone.name })),
  ];

  function go(next: Partial<MemberListFilters>) {
    router.push(memberListHref({ ...filters, ...next, page: 1 }));
  }

  return (
    <>
      <Select
        items={zoneItems}
        value={filters.zoneId ?? null}
        onValueChange={(value) => go({ zoneId: (value as string | null) ?? undefined })}
      >
        <SelectTrigger aria-label="Filter by zone" className={TRIGGER_CLASS}>
          <Filter className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {zoneItems.map((item) => (
            <SelectItem key={item.value ?? "all"} value={item.value} className="min-h-11 sm:min-h-9">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={STATUS_ITEMS}
        value={filters.status}
        onValueChange={(value) => go({ status: value as MemberStatusFilter })}
      >
        <SelectTrigger aria-label="Filter by status" className={TRIGGER_CLASS}>
          <span className="font-normal text-muted-foreground">Status:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value} className="min-h-11 sm:min-h-9">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
