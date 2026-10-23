import { CloudRain } from "lucide-react";
import { cn } from "cn";

import type { RainfallLevel } from "@/types/weather";

const RAINFALL_DISPLAY: Record<RainfallLevel, { label: string; color: string }> = {
  NONE: { label: "No heavy rain", color: "#9ca3af" },
  YELLOW: { label: "Yellow rainfall", color: "#eab308" },
  ORANGE: { label: "Orange rainfall", color: "#f97316" },
  RED: { label: "Red rainfall", color: "#dc2626" },
};

interface RainfallBadgeProps {
  level: RainfallLevel;
  className?: string;
}

/** A PAGASA rainfall level shown as a rain icon in the level color, plus the label text. */
export function RainfallBadge({ level, className }: RainfallBadgeProps) {
  const { label, color } = RAINFALL_DISPLAY[level];
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border bg-background px-2 text-sm font-medium whitespace-nowrap",
        className,
      )}
    >
      <CloudRain className="size-4" color={color} strokeWidth={2.5} aria-hidden="true" />
      {label}
    </span>
  );
}
