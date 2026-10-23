"use client";

import { Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HazardType, Severity } from "@/generated/prisma/enums";
import { alertListHref } from "@/lib/alerts/list-filters";
import { HAZARD_TYPES, SEVERITIES } from "@/lib/domain/hazards";
import type { AlertListFilters } from "@/types/alert";

const HAZARD_ITEMS = [
  { value: null, label: "Any hazard" },
  ...Object.values(HazardType).map((type) => ({ value: type, label: HAZARD_TYPES[type].label })),
];

// Worst first, as officers scan for critical alerts.
const SEVERITY_ITEMS = [
  { value: null, label: "Any severity" },
  ...Object.values(Severity)
    .reverse()
    .map((severity) => ({ value: severity, label: SEVERITIES[severity].label })),
];

const TRIGGER_CLASS = "h-11 w-full text-sm data-[size=default]:h-11";

/** The Filter button and its popover with hazard type and severity. Applying puts them in the URL, back on page 1. */
export function AlertFilterPopover({ filters }: { filters: AlertListFilters }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hazard, setHazard] = useState(filters.hazard);
  const [severity, setSeverity] = useState(filters.severity);
  const activeCount = (filters.hazard ? 1 : 0) + (filters.severity ? 1 : 0);

  function openChange(next: boolean) {
    // Each opening starts from what the URL has, not from an unapplied choice.
    if (next) {
      setHazard(filters.hazard);
      setSeverity(filters.severity);
    }
    setOpen(next);
  }

  function apply(next: Pick<AlertListFilters, "hazard" | "severity">) {
    setOpen(false);
    router.push(alertListHref({ ...filters, ...next, page: 1 }));
  }

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger
        render={
          <Button variant="outline" className="h-11 gap-[7px] px-3 text-xs sm:h-[39px]">
            <Filter className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
            Filter
            {activeCount > 0 && (
              <span className="grid min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground tabular-nums">
                <span className="sr-only">(</span>
                {activeCount}
                <span className="sr-only"> active)</span>
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-[min(18rem,calc(100vw-32px))] gap-4 p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="alert-filter-hazard">Hazard type</Label>
          <Select items={HAZARD_ITEMS} value={hazard} onValueChange={(value) => setHazard(value as HazardType | null)}>
            <SelectTrigger id="alert-filter-hazard" className={TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HAZARD_ITEMS.map((item) => (
                <SelectItem key={item.value ?? "any"} value={item.value} className="min-h-11">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="alert-filter-severity">Severity</Label>
          <Select
            items={SEVERITY_ITEMS}
            value={severity}
            onValueChange={(value) => setSeverity(value as Severity | null)}
          >
            <SelectTrigger id="alert-filter-severity" className={TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_ITEMS.map((item) => (
                <SelectItem key={item.value ?? "any"} value={item.value} className="min-h-11">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-11 px-4" onClick={() => apply({ hazard: null, severity: null })}>
            Clear
          </Button>
          <Button className="h-11 px-4" onClick={() => apply({ hazard, severity })}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
