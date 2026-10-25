import type { ReactNode } from "react";

export { SearchField } from "./search-field";

/** The bar above a table: a search box on the left, buttons on the right. */
export function TableToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-[15px] border-b border-[#e7ece8] px-4 py-[11px] dark:border-border">
      {children}
    </div>
  );
}
