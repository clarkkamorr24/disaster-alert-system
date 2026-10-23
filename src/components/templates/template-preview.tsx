"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentMinute } from "@/hooks/use-current-minute";
import { withPrefix } from "@/lib/domain/sms-text";
import { renderTemplate } from "@/lib/templates/render";

const SAMPLE = {
  hazard: "Volcanic eruption",
  level: "Alert Level 3",
  zones: ["Purok 1", "Purok 2"],
};

interface TemplatePreviewProps {
  body: string;
  prefix: string;
}

/** The template filled with sample values, shown as a text message bubble. */
export function TemplatePreview({ body, prefix }: TemplatePreviewProps) {
  // Null until hydrated, so the server never renders a clock reading.
  const now = useCurrentMinute();
  const trimmed = body.trim();

  return (
    <section aria-labelledby="template-preview-heading" className="flex flex-col gap-2">
      <h2 id="template-preview-heading" className="text-sm leading-none font-medium">
        Preview
      </h2>
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">
          Sample values: {SAMPLE.hazard}, {SAMPLE.level}, {SAMPLE.zones.join(" and ")}, the
          current time.
        </p>
        <div className="max-w-sm self-start rounded-2xl rounded-bl-sm bg-card px-4 py-3 text-base whitespace-pre-wrap break-words shadow-sm ring-1 ring-border">
          {trimmed === "" ? (
            <span className="text-muted-foreground">Type a message to see the preview.</span>
          ) : now === null ? (
            <Skeleton className="h-5 w-56" />
          ) : (
            withPrefix(renderTemplate(trimmed, { ...SAMPLE, date: new Date(now) }), prefix)
          )}
        </div>
      </div>
    </section>
  );
}
