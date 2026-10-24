import type { HazardType } from "@/generated/prisma/enums";

/**
 * Background and icon color of each hazard's icon tile, in light and dark
 * mode. Static strings so Tailwind can find every class.
 */
export const HAZARD_TINT_CLASSES: Record<HazardType, string> = {
  VOLCANIC_ERUPTION: "bg-[#fff1ef] text-[#a4473f] dark:bg-[#ff9b8f]/15 dark:text-[#ff9b8f]",
  ASHFALL: "bg-[#f3f1ef] text-[#6b625b] dark:bg-[#c9bfb6]/15 dark:text-[#c9bfb6]",
  LAHAR: "bg-[#fbf3e6] text-[#8a5a12] dark:bg-[#e8b766]/15 dark:text-[#e8b766]",
  TYPHOON: "bg-[#edf3fd] text-[#2f5fb3] dark:bg-[#93b4ec]/15 dark:text-[#93b4ec]",
  HEAVY_RAIN: "bg-[#ebf5fb] text-[#1f6f9c] dark:bg-[#8cc6e6]/15 dark:text-[#8cc6e6]",
  FLOOD: "bg-[#e9f6f8] text-[#16707f] dark:bg-[#7fcfdb]/15 dark:text-[#7fcfdb]",
  STRONG_WIND: "bg-[#e9f5f3] text-[#0f6b63] dark:bg-[#7fd1c6]/15 dark:text-[#7fd1c6]",
  DROUGHT: "bg-[#fdf3e7] text-[#9a4d0b] dark:bg-[#f0b27a]/15 dark:text-[#f0b27a]",
};

/**
 * Sets `--hazard-accent` to each hazard's icon color, in light and dark mode, so a
 * component can use it for borders or tints (such as a chosen hazard tile).
 */
export const HAZARD_ACCENT_CLASSES: Record<HazardType, string> = {
  VOLCANIC_ERUPTION: "[--hazard-accent:#a4473f] dark:[--hazard-accent:#ff9b8f]",
  ASHFALL: "[--hazard-accent:#6b625b] dark:[--hazard-accent:#c9bfb6]",
  LAHAR: "[--hazard-accent:#8a5a12] dark:[--hazard-accent:#e8b766]",
  TYPHOON: "[--hazard-accent:#2f5fb3] dark:[--hazard-accent:#93b4ec]",
  HEAVY_RAIN: "[--hazard-accent:#1f6f9c] dark:[--hazard-accent:#8cc6e6]",
  FLOOD: "[--hazard-accent:#16707f] dark:[--hazard-accent:#7fcfdb]",
  STRONG_WIND: "[--hazard-accent:#0f6b63] dark:[--hazard-accent:#7fd1c6]",
  DROUGHT: "[--hazard-accent:#9a4d0b] dark:[--hazard-accent:#f0b27a]",
};
