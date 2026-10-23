import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface SectionHeaderProps {
  id: string;
  title: string;
  description: string;
  /** Where the link goes; omit to hide it. */
  href?: string;
  linkLabel?: string;
  /** Shown on the right instead of a link, such as the weather update time. */
  aside?: ReactNode;
}

/** A dashboard section's heading and subtitle, with an optional link on the right. */
export function SectionHeader({ id, title, description, href, linkLabel, aside }: SectionHeaderProps) {
  return (
    <div className="mt-[30px] mb-[13px] flex flex-wrap items-end justify-between gap-x-5 gap-y-1">
      <div>
        <h2 id={id} className="font-heading text-lg font-bold tracking-[-0.03em]">
          {title}
        </h2>
        <p className="mt-[3px] text-xs text-[#7a887f] dark:text-muted-foreground">{description}</p>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex min-h-11 items-center gap-[3px] px-0.5 text-xs font-bold text-link hover:text-primary-hover"
        >
          {linkLabel}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
      {aside}
    </div>
  );
}

/** Placeholder for a {@link SectionHeader} while its section loads. */
export function SectionHeaderSkeleton() {
  return (
    <div className="mt-[30px] mb-[13px] flex flex-col gap-[3px]">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-64 max-w-full" />
    </div>
  );
}
