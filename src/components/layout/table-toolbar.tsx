import { Search } from "lucide-react";
import Form from "next/form";
import type { ReactNode } from "react";

/** The bar above a table: a search box on the left, buttons on the right. */
export function TableToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-[15px] border-b border-[#e7ece8] px-4 py-[11px] dark:border-border">
      {children}
    </div>
  );
}

interface SearchFieldProps {
  /** The page the search submits to, such as `/alerts`. */
  action: string;
  /** Names the search box for screen readers. */
  label: string;
  placeholder: string;
  defaultValue: string;
  /** Other params to keep, such as the tab and filters. Empty values are left out. */
  keep?: Record<string, string | null>;
}

/**
 * A search box that submits as a GET form (`?q=`), keeping the given params
 * and going back to page 1.
 */
export function SearchField({ action, label, placeholder, defaultValue, keep = {} }: SearchFieldProps) {
  return (
    <Form action={action} role="search" className="flex min-w-[200px] flex-[0_1_330px]">
      {Object.entries(keep).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <label className="flex min-h-[39px] flex-1 items-center gap-[9px] rounded-lg border border-input bg-table-head px-[11px] text-[#8b978f] focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/25 dark:text-muted-foreground">
        <Search className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span className="sr-only">{label}</span>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-10 min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-[#8b978f] dark:placeholder:text-muted-foreground"
        />
      </label>
    </Form>
  );
}
