"use client";

import { SegmentedControl } from "@/components/layout/segmented-control";
import { Severity } from "@/generated/prisma/enums";
import { SEVERITIES } from "@/lib/domain/hazards";

// Worst first, as in the mockup.
const OPTIONS = Object.values(Severity)
  .reverse()
  .map((severity) => ({ value: severity, label: SEVERITIES[severity].label }));

interface SeverityPickerProps {
  value: Severity | null;
  onChange: (severity: Severity) => void;
  /** The id of the element that labels the control. */
  labelledBy: string;
  /** The id of the field's error message, when there is one. */
  errorId?: string;
  disabled?: boolean;
}

/** Critical / High / Moderate / Low as a segmented control. */
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
