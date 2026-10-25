import Link from "next/link";
import { cn } from "cn";

import { PageSizeSelect } from "@/components/layout/page-size-select";
import { PAGE_SIZES, type PageSize } from "@/lib/pagination";

interface PaginationFooterProps {
  /** 1-based index of the first row shown; 0 when there are none. */
  from: number;
  to: number;
  total: number;
  /** Plural noun for the rows, such as `alerts`. */
  noun: string;
  /** `null` on the first page. */
  prevHref: string | null;
  /** `null` on the last page. */
  nextHref: string | null;
  /** The current page, 1-based. */
  page: number;
  /** How many pages there are; at least 1. */
  pageCount: number;
  size: PageSize;
  /** The URL that shows the same rows at another page size, back on page 1. */
  sizeHref: (size: PageSize) => string;
}

const BUTTON_CLASS =
  "inline-flex min-h-11 items-center rounded-[7px] border border-[#dfe5e0] bg-card px-2.5 text-[13px] font-semibold text-[#536158] sm:min-h-8 dark:border-input dark:text-foreground";

function PageLink({ href, children }: { href: string | null; children: string }) {
  if (!href) {
    return (
      <span aria-disabled="true" className={cn(BUTTON_CLASS, "opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cn(BUTTON_CLASS, "hover:bg-accent hover:text-primary")}>
      {children}
    </Link>
  );
}

/** The bar under a table: "Showing 1–25 of N alerts", rows per page, "Page 1 of N", and Previous / Next links. */
export function PaginationFooter({
  from,
  to,
  total,
  noun,
  prevHref,
  nextHref,
  page,
  pageCount,
  size,
  sizeHref,
}: PaginationFooterProps) {
  const format = (n: number) => n.toLocaleString("en-US");
  return (
    <nav
      aria-label="Pagination"
      className="flex min-h-[54px] flex-wrap items-center justify-between gap-2 border-t border-[#e9edea] px-4 py-2 text-[13px] text-[#7d8981] dark:border-border dark:text-muted-foreground"
    >
      <span>
        Showing {format(from)}–{format(to)} of {format(total)} {noun}
      </span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <PageSizeSelect size={size} options={PAGE_SIZES.map((option) => ({ size: option, href: sizeHref(option) }))} />
        <span>
          Page {format(page)} of {format(pageCount)}
        </span>
        <div className="flex gap-1.5">
          <PageLink href={prevHref}>Previous</PageLink>
          <PageLink href={nextHref}>Next</PageLink>
        </div>
      </div>
    </nav>
  );
}
