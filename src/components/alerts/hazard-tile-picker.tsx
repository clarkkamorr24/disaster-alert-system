"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

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

/** One tile per hazard type, with its icon. A radio group: arrow keys move between tiles. */
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
        const { label, icon: Icon } = HAZARD_TYPES[type];
        return (
          <Radio.Root
            key={type}
            value={type}
            className="flex min-h-[76px] flex-col items-start gap-1.5 rounded-[9px] border bg-card p-3 text-left text-[13px] font-semibold outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/25 data-disabled:cursor-not-allowed data-disabled:opacity-60 data-disabled:hover:bg-card data-checked:border-primary data-checked:bg-accent data-checked:text-primary"
          >
            <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
            {label}
          </Radio.Root>
        );
      })}
    </RadioGroup>
  );
}
