import { cn } from "cn";

import type { Severity } from "@/generated/prisma/enums";
import { SEVERITIES } from "@/lib/domain/hazards";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

/** A severity shown as its icon in the severity color, plus the label text. */
export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const { label, icon: Icon, color } = SEVERITIES[severity];
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border bg-background px-2 text-sm font-medium whitespace-nowrap",
        className,
      )}
    >
      <Icon className="size-4" color={color} strokeWidth={2.5} aria-hidden="true" />
      {label}
    </span>
  );
}
