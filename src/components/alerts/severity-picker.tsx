"use client";

import { cn } from "cn";

import { SegmentedControl, type SegmentedOption } from "@/components/layout/segmented-control";
import { Severity } from "@/generated/prisma/enums";
import { SEVERITIES } from "@/lib/domain/hazards";

/** Icon color, and the chosen segment's soft background and text, in the severity's status tone. */
const TONE_CLASS: Record<Severity, { icon: string; segment: string }> = {
  CRITICAL: {
    icon: "text-status-critical",
    segment: "data-checked:bg-status-critical-soft data-checked:text-status-critical",
  },
  HIGH: { icon: "text-status-high", segment: "data-checked:bg-status-high-soft data-checked:text-status-high" },
  MODERATE: {
    icon: "text-status-moderate",
    segment: "data-checked:bg-status-moderate-soft data-checked:text-status-moderate",
  },
  LOW: { icon: "text-status-low", segment: "data-checked:bg-status-low-soft data-checked:text-status-low" },
};

// Worst first, as in the mockup.
const OPTIONS: SegmentedOption<Severity>[] = Object.values(Severity)
  .reverse()
  .map((severity) => {
    const { label, icon: Icon } = SEVERITIES[severity];
    return {
      value: severity,
      label,
      leading: <Icon className={cn("size-3.5 shrink-0", TONE_CLASS[severity].icon)} strokeWidth={2} aria-hidden="true" />,
      className: TONE_CLASS[severity].segment,
    };
  });

interface SeverityPickerProps {
  value: Severity | null;
  onChange: (severity: Severity) => void;
  /** The id of the element that labels the control. */
  labelledBy: string;
  /** The id of the field's error message, when there is one. */
  errorId?: string;
  disabled?: boolean;
}

/** Critical / High / Moderate / Low as a segmented control, each with its icon in its severity color. */
export function SeverityPicker({ value, onChange, labelledBy, errorId, disabled }: SeverityPickerProps) {
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      labelledBy={labelledBy}
      errorId={errorId}
      disabled={disabled}
    />
  );
}
