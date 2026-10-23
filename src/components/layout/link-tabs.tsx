import Link from "next/link";

/** One tab of {@link LinkTabs}. */
export interface LinkTab {
  href: string;
  label: string;
  /** Shown in a chip after the label. */
  count: number;
  current: boolean;
}

interface LinkTabsProps {
  /** Names the tab list for screen readers, such as "Alert status". */
  label: string;
  tabs: LinkTab[];
}

/** Tabs that are links, with a count chip each; the current one has `aria-current` and a green underline. */
export function LinkTabs({ label, tabs }: LinkTabsProps) {
  return (
    <nav
      aria-label={label}
      className="flex min-h-[52px] items-end gap-[25px] overflow-x-auto border-b border-[#e6ebe7] px-5 dark:border-border"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.current ? "page" : undefined}
          className="flex h-[52px] items-center gap-[7px] border-b-2 border-transparent text-xs font-semibold whitespace-nowrap text-[#77857c] outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/25 aria-[current=page]:border-[#247443] aria-[current=page]:text-primary dark:text-muted-foreground dark:aria-[current=page]:border-primary dark:aria-[current=page]:text-primary"
        >
          {tab.label}
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
            {tab.count.toLocaleString("en-US")}
          </span>
        </Link>
      ))}
    </nav>
  );
}
