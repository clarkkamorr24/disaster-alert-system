"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Severity } from "@/generated/prisma/enums";
import { SEVERITIES } from "@/lib/domain/hazards";

interface SeverityPickerProps {
  value: Severity | null;
  onChange: (severity: Severity) => void;
  /** The id of the field's error message, when there is one. */
  errorId?: string;
}

/** Four radio cards, Low to Critical, each with the severity's icon, color, and label. */
export function SeverityPicker({ value, onChange, errorId }: SeverityPickerProps) {
  return (
    <RadioGroup
      aria-labelledby="alert-severity-label"
      aria-describedby={errorId}
      aria-invalid={errorId ? true : undefined}
      value={value}
      onValueChange={(next) => onChange(next as Severity)}
      className="grid-cols-2 sm:grid-cols-4"
    >
      {Object.values(Severity).map((severity) => {
        const { label, icon: Icon, color } = SEVERITIES[severity];
        return (
          <label
            key={severity}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border p-3 hover:bg-muted has-data-checked:border-primary has-data-checked:bg-primary/5 has-data-checked:ring-1 has-data-checked:ring-primary"
          >
            <RadioGroupItem value={severity} />
            <Icon className="size-5 shrink-0" color={color} strokeWidth={2.5} aria-hidden="true" />
            <span className="font-medium">{label}</span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
