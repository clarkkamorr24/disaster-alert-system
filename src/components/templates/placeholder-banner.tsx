import { FileText } from "lucide-react";

import { TEMPLATE_PLACEHOLDERS } from "@/lib/templates/render";

/** The green banner above the template cards listing the placeholders a message can use. */
export function PlaceholderBanner() {
  return (
    <section
      aria-labelledby="placeholder-banner-heading"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[11px] border border-accent-border-soft bg-accent px-[18px] py-3.5"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-card text-link">
          <FileText className="size-[18px]" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 id="placeholder-banner-heading" className="text-[13px] font-bold text-title-foreground">
            Available placeholders
          </h2>
          <p className="text-xs text-accent-muted-foreground">Insert live alert details into any message.</p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="Placeholders">
        {TEMPLATE_PLACEHOLDERS.map((name) => (
          <li
            key={name}
            className="rounded-md border border-accent-border bg-card px-2 py-1 font-mono text-[11px] font-semibold text-link"
          >
            {`{${name}}`}
          </li>
        ))}
      </ul>
    </section>
  );
}
