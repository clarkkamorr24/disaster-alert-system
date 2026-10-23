"use client";

import { Square, SquareCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ComposeZone } from "@/types/broadcast";

interface ZoneChipPickerProps {
  zones: ComposeZone[];
  selected: string[];
  onChange: (zoneIds: string[]) => void;
  /** The id of the element that labels the group. */
  labelledBy: string;
  /** The id of the field's error message, when there is one. */
  errorId?: string;
  disabled?: boolean;
}

/** The "Select all zones" / "Clear all" button for a {@link ZoneChipPicker}. */
export function ZoneSelectAllButton({
  zones,
  selected,
  onChange,
  disabled,
}: Pick<ZoneChipPickerProps, "zones" | "selected" | "onChange" | "disabled">) {
  const allSelected = zones.length > 0 && selected.length === zones.length;
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={() => onChange(allSelected ? [] : zones.map((zone) => zone.id))}
      className="h-11 px-2.5 text-[11px] sm:h-[30px]"
    >
      {allSelected ? "Clear all" : "Select all zones"}
    </Button>
  );
}

/** One toggle chip per zone, with a check icon and the zone's active member count. */
export function ZoneChipPicker({ zones, selected, onChange, labelledBy, errorId, disabled }: ZoneChipPickerProps) {
  function toggle(zoneId: string) {
    const on = !selected.includes(zoneId);
    // Keep the zones' display order regardless of click order.
    onChange(zones.map((zone) => zone.id).filter((id) => (id === zoneId ? on : selected.includes(id))));
  }

  return (
    <div role="group" aria-labelledby={labelledBy} aria-describedby={errorId} className="flex flex-wrap gap-2">
      {zones.map((zone) => {
        const on = selected.includes(zone.id);
        const Icon = on ? SquareCheck : Square;
        return (
          <button
            key={zone.id}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => toggle(zone.id)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border bg-card px-3 text-xs font-semibold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-card aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-primary sm:min-h-[38px]"
          >
            <Icon className="size-4" strokeWidth={on ? 2.25 : 1.75} aria-hidden="true" />
            {zone.name}
            <span className="font-medium text-muted-foreground tabular-nums">
              {zone.activeMemberCount}
              <span className="sr-only"> {zone.activeMemberCount === 1 ? "member" : "members"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
