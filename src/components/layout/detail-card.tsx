import type { ReactNode } from "react";
import { cn } from "cn";

interface DetailCardProps {
  title: string;
  /** Small line under the title. */
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** A white card with a Manrope title, used for the sections of a detail page. */
export function DetailCard({ title, description, children, className }: DetailCardProps) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-5", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-bold tracking-[-0.03em]">{title}</h2>
        {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
