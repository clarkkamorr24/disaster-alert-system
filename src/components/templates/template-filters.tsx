"use client";

import { Filter, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HazardType } from "@/generated/prisma/enums";
import { HAZARD_TYPES } from "@/lib/domain/hazards";
import { templateListHref } from "@/lib/templates/list-filters";
import type { TemplateHazardFilter, TemplateListFilters, TemplateUsageFilter } from "@/types/template";

const HAZARD_ITEMS: { value: TemplateHazardFilter | null; label: string }[] = [
  { value: null, label: "All hazards" },
  { value: "ANY", label: "Any hazard" },
  ...Object.values(HazardType).map((value) => ({ value, label: HAZARD_TYPES[value].label })),
];

const USAGE_ITEMS: { value: TemplateUsageFilter | null; label: string }[] = [
  { value: null, label: "Any usage" },
  { value: "used", label: "Used" },
  { value: "unused", label: "Not used yet" },
];

const TRIGGER_CLASS =
  "h-11 gap-[7px] rounded-lg border-input bg-card px-3 text-xs font-semibold text-control-foreground data-[size=default]:h-11 sm:h-[39px] sm:data-[size=default]:h-[39px]";

/**
 * The hazard and usage selects of the templates toolbar: each goes to
 * `/templates` with its choice in the URL, keeping the search, the other
 * filter, and the view.
 */
export function TemplateFilters({ filters }: { filters: TemplateListFilters }) {
  const router = useRouter();
  const go = (next: Partial<TemplateListFilters>) =>
    router.push(templateListHref({ ...filters, ...next }), { scroll: false });

  return (
    <>
      <Select
        items={HAZARD_ITEMS}
        value={filters.hazard}
        onValueChange={(value) => go({ hazard: value as TemplateHazardFilter | null })}
      >
        <SelectTrigger aria-label="Filter by hazard" className={TRIGGER_CLASS}>
          <Filter className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HAZARD_ITEMS.map((item) => (
            <SelectItem key={item.value ?? "all"} value={item.value} className="min-h-11 sm:min-h-9">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={USAGE_ITEMS}
        value={filters.usage}
        onValueChange={(value) => go({ usage: value as TemplateUsageFilter | null })}
      >
        <SelectTrigger aria-label="Filter by usage" className={TRIGGER_CLASS}>
          <Repeat className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {USAGE_ITEMS.map((item) => (
            <SelectItem key={item.value ?? "all"} value={item.value} className="min-h-11 sm:min-h-9">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
