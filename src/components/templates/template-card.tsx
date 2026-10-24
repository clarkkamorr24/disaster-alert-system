import { MessageSquareText, Pencil } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

import { HazardIconTile } from "@/components/alerts/hazard-icon-tile";
import { HAZARD_TINT_CLASSES } from "@/components/alerts/hazard-tint";
import { DuplicateTemplateButton } from "@/components/templates/duplicate-template-button";
import { TemplateCardMenu } from "@/components/templates/template-card-menu";
import { buttonVariants } from "@/components/ui/button";
import type { HazardType } from "@/generated/prisma/enums";
import { HAZARD_TYPES } from "@/lib/domain/hazards";
import { usageLabel } from "@/lib/templates/usage";

const ANY_HAZARD_TINT = "bg-any-hazard-tile text-any-hazard-tile-foreground";

interface TemplateCardProps {
  id: string;
  name: string;
  hazardType: HazardType | null;
  body: string;
  /** Broadcasts sent with this template. */
  usageCount: number;
}

function TemplateTile({ hazardType }: { hazardType: HazardType | null }) {
  if (hazardType) return <HazardIconTile type={hazardType} className="size-[38px]" />;
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-[38px] shrink-0 place-items-center rounded-[9px]", ANY_HAZARD_TINT)}
    >
      <MessageSquareText className="size-[18px]" strokeWidth={1.75} />
    </span>
  );
}

/** One template in the grid: hazard tile, name and tag, the full message, usage, and actions. */
export function TemplateCard({ id, name, hazardType, body, usageCount }: TemplateCardProps) {
  return (
    <article className="flex min-h-[245px] min-w-0 flex-col rounded-xl border bg-card p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <TemplateTile hazardType={hazardType} />
        <TemplateCardMenu id={id} name={name} />
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="min-w-0 font-heading text-[15px] font-bold tracking-[-0.02em] break-words text-title-foreground">
          {name}
        </h2>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap",
            hazardType ? HAZARD_TINT_CLASSES[hazardType] : ANY_HAZARD_TINT,
          )}
        >
          {hazardType ? HAZARD_TYPES[hazardType].label : "Any hazard"}
        </span>
      </div>

      <p className="mt-2.5 flex-1 text-[13px] leading-[1.65] break-words whitespace-pre-wrap text-muted-foreground">
        {body}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3.5">
        <span className="text-xs text-subtle-foreground">{usageLabel(usageCount)}</span>
        <div className="flex gap-2">
          <DuplicateTemplateButton id={id} name={name} />
          <Link
            href={`/templates/${id}`}
            aria-label={`Edit template "${name}"`}
            className={buttonVariants({ variant: "outline", className: "h-[34px] gap-1.5 px-2.5 text-[11px]" })}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Link>
        </div>
      </div>
    </article>
  );
}
