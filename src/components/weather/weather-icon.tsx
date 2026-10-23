import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { weatherIconName, type WeatherIconName } from "@/lib/weather/icons";

const ICONS: Record<WeatherIconName, LucideIcon> = {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudLightning,
};

/** The Lucide icon for a WMO weather code. Decorative: show the condition as text next to it. */
export function WeatherIcon({ code, className }: { code: number; className?: string }) {
  const Icon = ICONS[weatherIconName(code)];
  return <Icon className={cn("size-[18px] shrink-0", className)} strokeWidth={1.75} aria-hidden="true" />;
}
