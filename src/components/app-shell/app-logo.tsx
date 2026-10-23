import { Mountain } from "lucide-react";
import { cn } from "cn";

interface AppLogoProps {
  /** `sidebar`: pale tile on the dark green sidebar. `brand`: green tile on a light background. */
  variant: "sidebar" | "brand";
  /** `default` is 38px (sidebar, sign-in); `sm` is 32px (mobile header). */
  size?: "default" | "sm";
  className?: string;
}

/** The mountain logo tile. Decorative: the name next to it says what it is. */
export function AppLogo({ variant, size = "default", className }: AppLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center",
        size === "default" ? "size-[38px] rounded-[11px]" : "size-8 rounded-[9px]",
        variant === "sidebar"
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "bg-[#185d35] text-white",
        className,
      )}
    >
      <Mountain className={size === "default" ? "size-[19px]" : "size-4"} strokeWidth={1.75} />
    </span>
  );
}
