"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { ZoneOption } from "@/types/member";

interface ZonePickerProps {
  zones: ZoneOption[];
  selected: string[];
  onChange: (zoneIds: string[]) => void;
  /** The id of the field's error message, when there is one. */
  errorId?: string;
}

/** An "All zones" checkbox above one checkbox per zone. */
export function ZonePicker({ zones, selected, onChange, errorId }: ZonePickerProps) {
  const allSelected = selected.length === zones.length;
  const someSelected = selected.length > 0 && !allSelected;

  function toggle(zoneId: string, checked: boolean) {
    // Keep the zones' display order regardless of click order.
    onChange(zones.map((zone) => zone.id).filter((id) => (id === zoneId ? checked : selected.includes(id))));
  }

  return (
    <div
      role="group"
      aria-labelledby="alert-zones-label"
      aria-describedby={errorId}
      className="flex flex-col rounded-lg border"
    >
      <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b px-3 py-2 font-medium hover:bg-muted">
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={(checked) => onChange(checked ? zones.map((zone) => zone.id) : [])}
          aria-invalid={errorId ? true : undefined}
          className="size-5"
        />
        All zones
      </label>
      <div className="grid sm:grid-cols-2">
        {zones.map((zone) => (
          <label
            key={zone.id}
            className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted"
          >
            <Checkbox
              checked={selected.includes(zone.id)}
              onCheckedChange={(checked) => toggle(zone.id, checked)}
              aria-invalid={errorId ? true : undefined}
              className="size-5"
            />
            {zone.name}
          </label>
        ))}
      </div>
    </div>
  );
}
