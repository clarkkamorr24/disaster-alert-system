import { cn } from "cn";

import type { DeliveryBreakdown } from "@/lib/broadcast/status";

interface DeliveryBarProps extends DeliveryBreakdown {
  /** Sets the bar's size, such as `h-1 w-40`. */
  className?: string;
}

/**
 * A thin bar split into sent (green), pending (amber), and not reached (red)
 * on a gray track. The widths are SVG attributes, so no inline styles are needed.
 */
export function DeliveryBar({ sent, pending, notReached, className }: DeliveryBarProps) {
  const total = sent + pending + notReached;
  const share = (count: number) => (total === 0 ? 0 : (count / total) * 100);
  const widths = [share(sent), share(pending), share(notReached)];
  const segments = ["fill-delivery-sent", "fill-delivery-pending", "fill-delivery-failed"].map((fill, index) => ({
    fill,
    x: widths.slice(0, index).reduce((sum, width) => sum + width, 0),
    width: widths[index],
  }));

  return (
    <svg
      role="img"
      aria-label={`${sent} sent, ${pending} pending, ${notReached} not reached`}
      className={cn("block overflow-hidden rounded-full", className)}
    >
      <rect width="100%" height="100%" className="fill-delivery-track" />
      {segments.map((segment) => (
        <rect key={segment.fill} x={`${segment.x}%`} width={`${segment.width}%`} height="100%" className={segment.fill} />
      ))}
    </svg>
  );
}
