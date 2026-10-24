"use client";

import { SmsPreview } from "@/components/alerts/sms-preview";
import { useCurrentMinute } from "@/hooks/use-current-minute";
import { estimateCredits, withPrefix } from "@/lib/domain/sms-text";
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

/** The sticky card next to the template form: the template filled with sample values, and its length. */
export function TemplatePreview({ body, prefix }: TemplatePreviewProps) {
  // Null until hydrated, so the server never renders a clock reading.
  const now = useCurrentMinute();
  const trimmed = body.trim();
  const text =
    trimmed === "" ? "" : now === null ? null : withPrefix(renderTemplate(trimmed, { ...SAMPLE, date: new Date(now) }), prefix);
  const credits = estimateCredits(text ?? "");

  return (
    <section
      aria-labelledby="template-preview-heading"
      className="sticky top-[84px] flex min-w-0 flex-[2_1_300px] flex-col gap-4 rounded-xl border bg-card p-[22px]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="template-preview-heading" className="font-heading text-base font-bold tracking-[-0.03em]">
          Preview
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Sample values: {SAMPLE.hazard}, {SAMPLE.level}, {SAMPLE.zones.join(" and ")}, the current time.
        </p>
      </div>
      <SmsPreview text={text} prefix={prefix} />
      {text && (
        <p className="text-[13px] text-muted-foreground tabular-nums">
          {text.length} characters · {credits} {credits === 1 ? "credit" : "credits"} per member
        </p>
      )}
    </section>
  );
}
