import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Small uppercase line above the title, such as "Association records". */
  eyebrow: string;
  title: string;
  description?: string;
  /** Buttons on the right, such as "New alert". */
  action?: ReactNode;
}

/** The title block at the top of every app page. */
export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pt-[30px] pb-6">
      <div className="min-w-0">
        <p className="mb-[5px] text-[13px] font-bold tracking-[.08em] text-[#668070] uppercase dark:text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="font-heading text-[clamp(24px,2.3vw,31px)] font-bold tracking-[-0.03em]">
          {title}
        </h1>
        {description && <p className="mt-[5px] text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2.5">{action}</div>}
    </div>
  );
}

/** Classes for a page header's primary action link, matching the mockup's 44px button. */
export const PAGE_ACTION_CLASS = "h-11 gap-2 px-[17px] text-[13px]";
