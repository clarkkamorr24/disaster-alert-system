"use client";

import { Repeat } from "lucide-react";
import Link from "next/link";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NO_UNREACHED_MESSAGE } from "@/lib/broadcast/compose";
import type { ComposeResend, ComposeTemplate } from "@/types/broadcast";

interface TemplateSelectProps {
  templates: ComposeTemplate[];
  value: string | null;
  onChange: (templateId: string | null) => void;
}

/** The template picker; choosing one replaces the message. */
export function TemplateSelect({ templates, value, onChange }: TemplateSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="compose-template" className="text-sm font-semibold">
        Template
      </Label>
      <Select
        items={templates.map((t) => ({ value: t.id, label: t.name }))}
        value={value}
        onValueChange={(next) => onChange(next as string | null)}
      >
        <SelectTrigger id="compose-template" className="w-full text-sm data-[size=default]:h-[42px]">
          <SelectValue placeholder="Choose a template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => (
            <SelectItem key={t.id} value={t.id} className="min-h-11">
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Choosing a template replaces the message.</p>
    </div>
  );
}

/** For a resend, who it goes to instead of the zone picker, with a link to the original broadcast. */
export function ResendRecipients({ resend }: { resend: ComposeResend }) {
  const { memberCount } = resend;
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-accent-border bg-accent px-4 py-3.5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Repeat className="size-4 text-primary" aria-hidden="true" />
        Resending to {memberCount} {memberCount === 1 ? "member who was" : "members who were"} not reached
      </h2>
      {memberCount > 0 ? (
        <p className="text-[13px] text-muted-foreground">In {resend.zoneNames.join(", ")}.</p>
      ) : (
        <p className="text-[13px] text-destructive">{NO_UNREACHED_MESSAGE}</p>
      )}
      <p className="text-xs text-muted-foreground">Members who were deactivated since are left out.</p>
      <Link
        href={`/broadcasts/${resend.retryOfId}`}
        className="inline-flex min-h-11 w-fit items-center text-xs font-bold text-link hover:text-primary-hover sm:min-h-0"
      >
        Original broadcast of {resend.originalSentAt}
      </Link>
    </div>
  );
}
