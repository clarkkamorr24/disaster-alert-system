import { cn } from "cn";

import type { HazardType } from "@/generated/prisma/enums";
import { HAZARD_TYPES } from "@/lib/domain/hazards";

interface HazardBadgeProps {
  type: HazardType;
  className?: string;
}

/** A hazard type shown as its icon in the hazard color, plus the label text. */
export function HazardBadge({ type, className }: HazardBadgeProps) {
  const { label, icon: Icon, color } = HAZARD_TYPES[type];
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 text-sm font-medium whitespace-nowrap",
        className,
      )}
    >
      <Icon className="size-4" color={color} strokeWidth={2.5} aria-hidden="true" />
      {label}
    </span>
  );
}
