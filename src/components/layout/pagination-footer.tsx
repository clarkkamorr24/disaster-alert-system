import Link from "next/link";
import { cn } from "cn";

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
}

const BUTTON_CLASS =
  "inline-flex min-h-8 items-center rounded-[7px] border border-[#dfe5e0] bg-card px-2.5 text-[11px] font-semibold text-[#536158] dark:border-input dark:text-foreground";

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

/** The bar under a table: "Showing 1–25 of N alerts" and Previous / Next links. */
export function PaginationFooter({ from, to, total, noun, prevHref, nextHref }: PaginationFooterProps) {
  const format = (n: number) => n.toLocaleString("en-US");
  return (
    <nav
      aria-label="Pagination"
      className="flex min-h-[54px] flex-wrap items-center justify-between gap-2 border-t border-[#e9edea] px-4 py-2 text-[11px] text-[#7d8981] dark:border-border dark:text-muted-foreground"
    >
      <span>
        Showing {format(from)}–{format(to)} of {format(total)} {noun}
      </span>
      <div className="flex gap-1.5">
        <PageLink href={prevHref}>Previous</PageLink>
        <PageLink href={nextHref}>Next</PageLink>
      </div>
    </nav>
  );
}
