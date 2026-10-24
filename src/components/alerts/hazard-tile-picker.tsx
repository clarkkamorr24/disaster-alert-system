"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { cn } from "cn";

import { HazardIconTile } from "@/components/alerts/hazard-icon-tile";
import { HAZARD_ACCENT_CLASSES } from "@/components/alerts/hazard-tint";
import { HazardType } from "@/generated/prisma/enums";
import { HAZARD_TYPES } from "@/lib/domain/hazards";

interface HazardTilePickerProps {
  value: HazardType | null;
  onChange: (hazardType: HazardType) => void;
  /** The id of the element that labels the group. */
  labelledBy: string;
  /** The id of the field's error message, when there is one. */
  errorId?: string;
  disabled?: boolean;
}

/**
 * One tile per hazard type, with its icon on its tinted tile; the chosen one takes the
 * hazard's color. A radio group: arrow keys move between tiles.
 */
export function HazardTilePicker({ value, onChange, labelledBy, errorId, disabled }: HazardTilePickerProps) {
  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      aria-describedby={errorId}
      aria-invalid={errorId ? true : undefined}
      value={value}
      onValueChange={(next) => onChange(next as HazardType)}
      disabled={disabled}
      className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2"
    >
      {Object.values(HazardType).map((type) => {
        return (
          <Radio.Root
            key={type}
            value={type}
            className={cn(
              "flex min-h-[76px] flex-col items-start gap-2 rounded-[9px] border bg-card p-3 text-left text-[13px] font-semibold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/25 data-disabled:cursor-not-allowed data-disabled:opacity-60 data-disabled:hover:bg-card",
              "data-checked:border-(--hazard-accent) data-checked:bg-(--hazard-accent)/6 data-checked:text-(--hazard-accent) data-checked:ring-1 data-checked:ring-(--hazard-accent)",
              HAZARD_ACCENT_CLASSES[type],
            )}
          >
            <HazardIconTile type={type} className="size-8" />
            {HAZARD_TYPES[type].label}
          </Radio.Root>
        );
      })}
    </RadioGroup>
  );
}
