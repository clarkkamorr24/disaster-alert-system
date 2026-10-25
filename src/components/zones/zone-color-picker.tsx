"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Check } from "lucide-react";
import { cn } from "cn";

import { ZONE_COLOR_KEYS, ZONE_COLORS, type ZoneColor } from "@/lib/zone-colors";

// Literal class names so Tailwind generates them.
const SWATCH_CLASSES: Record<ZoneColor, string> = {
  sky: "bg-zone-area-sky",
  blue: "bg-zone-area-blue",
  indigo: "bg-zone-area-indigo",
  violet: "bg-zone-area-violet",
  purple: "bg-zone-area-purple",
  fuchsia: "bg-zone-area-fuchsia",
  pink: "bg-zone-area-pink",
  cyan: "bg-zone-area-cyan",
};

interface ZoneColorPickerProps {
  value: ZoneColor;
  onChange: (color: ZoneColor) => void;
  /** The id of the element that labels the group. */
  labelledBy: string;
  /** The id of the help text. */
  describedBy?: string;
}

/** One round swatch per {@link ZONE_COLORS} entry, named for screen readers; arrow keys move between them. */
export function ZoneColorPicker({ value, onChange, labelledBy, describedBy }: ZoneColorPickerProps) {
  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      value={value}
      onValueChange={(next) => onChange(next as ZoneColor)}
      className="flex flex-wrap gap-1"
    >
      {ZONE_COLOR_KEYS.map((key) => (
        <Radio.Root
          key={key}
          value={key}
          aria-label={ZONE_COLORS[key]}
          title={ZONE_COLORS[key]}
          className="group grid size-11 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
        >
          <span
            className={cn(
              "grid size-8 place-items-center rounded-full text-white ring-offset-2 ring-offset-card group-data-checked:ring-2 group-data-checked:ring-foreground",
              SWATCH_CLASSES[key],
            )}
          >
            <Check className="size-4 opacity-0 group-data-checked:opacity-100" strokeWidth={2.5} aria-hidden="true" />
          </span>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
