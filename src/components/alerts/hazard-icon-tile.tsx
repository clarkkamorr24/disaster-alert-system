import { cn } from "cn";

import { HAZARD_TINT_CLASSES } from "@/components/alerts/hazard-tint";
import type { HazardType } from "@/generated/prisma/enums";
import { HAZARD_TYPES } from "@/lib/domain/hazards";

/** The hazard's icon on its tinted tile. Decorative: show the hazard as text next to it. */
export function HazardIconTile({ type, className }: { type: HazardType; className?: string }) {
  const Icon = HAZARD_TYPES[type].icon;
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-[35px] shrink-0 place-items-center rounded-[9px]", HAZARD_TINT_CLASSES[type], className)}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </span>
  );
}
