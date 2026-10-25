"use client";

import { Send } from "lucide-react";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ConfirmSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Send this alert…" when the SMS is about an alert, otherwise "Send this message…". */
  subject: "alert" | "message";
  /** The first row, such as `Alert` / `Hazard · Severity` or `About` / `Announcement`. */
  about: { label: string; value: string };
  memberCount: number;
  totalCredits: number;
  /** The zones the members live in, with their counts when known. */
  zones: { name: string; count?: number }[];
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-t border-row-border px-3.5 py-2.5 text-[13px] first:border-t-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{children}</span>
    </div>
  );
}

function plural(count: number, word: string): string {
  return `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * "Send this alert / message to N members?": what it is about, recipients,
 * credits, and zones, with a checkbox the officer must tick before Send is
 * enabled. It can't be closed while sending.
 */
export function ConfirmSendDialog({
  open,
  onOpenChange,
  subject,
  about,
  memberCount,
  totalCredits,
  zones,
  checked,
  onCheckedChange,
  pending,
  onConfirm,
}: ConfirmSendDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent
        overlayClassName="bg-scrim/55"
        className="flex max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] flex-col gap-[18px] overflow-y-auto rounded-xl border p-6 shadow-[0_20px_40px_rgb(9_24_15/.25)] ring-0 data-[size=default]:max-w-[480px] data-[size=default]:sm:max-w-[480px]"
      >
        <div>
          <AlertDialogTitle className="font-heading text-lg font-bold tracking-[-0.03em]">
            Send this {subject} to {plural(memberCount, "member")}?
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-1.5 text-sm leading-normal text-balance">
            This sends immediately. There is no second approver, so check the recipients and zones below.
          </AlertDialogDescription>
        </div>

        <div className="flex flex-col rounded-[9px] border">
          <Row label={about.label}>{about.value}</Row>
          <Row label="Recipients">{plural(memberCount, "active member")}</Row>
          <Row label="SMS to queue">{plural(totalCredits, "credit")}</Row>
          <div className="flex flex-col gap-2 border-t border-row-border px-3.5 py-2.5 text-[13px]">
            <span className="text-muted-foreground">Zones</span>
            <ul className="flex flex-wrap gap-1.5">
              {zones.map((zone) => (
                <li
                  key={zone.name}
                  className="inline-flex min-h-6 items-center rounded-md border border-accent-border bg-accent px-2 text-[13px] font-semibold text-primary"
                >
                  {zone.count === undefined ? zone.name : `${zone.name} · ${zone.count}`}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-[1.4]">
          <Checkbox
            checked={checked}
            onCheckedChange={(next) => onCheckedChange(next)}
            disabled={pending}
            className="mt-0.5 size-4"
          />
          I have checked the message, zones and recipient count.
        </label>

        <div className="flex flex-wrap justify-end gap-2">
          <AlertDialogCancel className="h-11 px-4 text-[13px]" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <Button className="h-11 gap-2 px-[17px] text-[13px]" disabled={!checked || pending} onClick={onConfirm}>
            <Send className="size-4" aria-hidden="true" />
            {pending ? "Sending…" : `Send to ${plural(memberCount, "member")}`}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
