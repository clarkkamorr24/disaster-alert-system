"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

/** One choice of a {@link SegmentedControl}. */
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  /** `null` when nothing is chosen yet. */
  value: T | null;
  onChange: (value: T) => void;
  /** The id of the element that labels the control. */
  labelledBy: string;
  /** The id of the field's error message, when there is one. */
  errorId?: string;
  disabled?: boolean;
}

/**
 * A gray track of segments with the chosen one in white. It is a radio group:
 * arrow keys move between segments.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
  errorId,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      aria-describedby={errorId}
      aria-invalid={errorId ? true : undefined}
      value={value}
      onValueChange={(next) => onChange(next as T)}
      disabled={disabled}
      className="inline-flex flex-wrap gap-0.5 self-start rounded-[9px] bg-[#eef2ef] p-[3px] aria-invalid:ring-2 aria-invalid:ring-destructive/40 dark:bg-muted"
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className="min-h-11 rounded-[7px] px-3.5 text-xs font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 data-disabled:cursor-not-allowed data-disabled:opacity-60 data-checked:bg-card data-checked:text-foreground data-checked:shadow-[0_1px_2px_rgb(23_35_28/.1)] sm:min-h-8"
        >
          {option.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
