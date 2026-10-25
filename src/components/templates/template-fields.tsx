"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HazardType } from "@/generated/prisma/enums";
import { HAZARD_TYPES } from "@/lib/domain/hazards";

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
