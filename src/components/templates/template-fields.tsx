"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HazardType } from "@/generated/prisma/enums";
import { HAZARD_TYPES } from "@/lib/domain/hazards";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/templates/render";

/** The select value for "Any hazard"; submitted as a blank hazard type. */
export const ANY_HAZARD = "ANY";
export type HazardChoice = HazardType | typeof ANY_HAZARD;

const hazardItems: { value: HazardChoice; label: string }[] = [
  { value: ANY_HAZARD, label: "Any hazard" },
  ...Object.values(HazardType).map((type) => ({ value: type, label: HAZARD_TYPES[type].label })),
];

interface HazardSelectProps {
  id: string;
  value: HazardChoice;
  onChange: (value: HazardChoice) => void;
  /** Props that link the trigger to its error message; empty when the field is valid. */
  errorProps: { "aria-invalid"?: boolean; "aria-describedby"?: string };
}

/** The template's hazard type, with "Any hazard" first. */
export function HazardSelect({ id, value, onChange, errorProps }: HazardSelectProps) {
  return (
    <Select
      items={hazardItems}
      value={value}
      onValueChange={(next) => onChange((next as HazardChoice | null) ?? ANY_HAZARD)}
    >
      <SelectTrigger id={id} {...errorProps} className="w-full text-sm data-[size=default]:h-[42px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {hazardItems.map((item) => {
          const config = item.value === ANY_HAZARD ? null : HAZARD_TYPES[item.value];
          return (
            <SelectItem key={item.value} value={item.value} className="min-h-11 text-sm">
              {config && <config.icon className="size-4" color={config.color} strokeWidth={2.5} aria-hidden="true" />}
              {item.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/** Buttons that insert `{hazard}`, `{level}`, `{zones}`, or `{date}` into the message. */
export function PlaceholderChips({ onInsert }: { onInsert: (name: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Insert a placeholder">
      <span className="text-xs text-muted-foreground">Insert:</span>
      {TEMPLATE_PLACEHOLDERS.map((name) => (
        <Button
          key={name}
          type="button"
          variant="outline"
          onClick={() => onInsert(name)}
          className="h-11 border-accent-border px-2.5 font-mono text-[11px] font-semibold text-link sm:h-8 dark:border-accent-border dark:text-link"
        >
          {`{${name}}`}
        </Button>
      ))}
    </div>
  );
}
