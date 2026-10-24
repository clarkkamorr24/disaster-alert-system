import { Plus } from "lucide-react";
import Link from "next/link";

/** The dashed last card of the template grid, linking to `/templates/new`. */
export function NewTemplateCard() {
  return (
    <Link
      href="/templates/new"
      className="flex min-h-[245px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-dashed-border p-[18px] text-center outline-none hover:border-primary hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/25"
    >
      <span aria-hidden="true" className="grid size-[42px] place-items-center rounded-full bg-accent text-primary">
        <Plus className="size-5" strokeWidth={2} />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-heading text-[15px] font-bold tracking-[-0.02em] text-title-foreground">
          Create a new template
        </span>
        <span className="text-[13px] text-muted-foreground">Build a reusable SMS message</span>
      </span>
    </Link>
  );
}
