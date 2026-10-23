import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface SectionHeaderProps {
  id: string;
  title: string;
  /** Where "View all" goes; omit to hide the link. */
  viewAllHref?: string;
}

/** A dashboard section's heading, with an optional "View all" link. */
export function SectionHeader({ id, title, viewAllHref }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex min-h-11 items-center gap-1 px-1 text-sm font-medium text-primary hover:underline"
        >
          View all
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
