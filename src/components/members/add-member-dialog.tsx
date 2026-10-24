"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";

import { PAGE_ACTION_CLASS } from "@/components/layout/page-header";
import { MemberForm } from "@/components/members/member-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ZoneOption } from "@/types/member";

/**
 * The page header's Add member button and its pop-up. Saving keeps the officer
 * on the list, which refreshes in place; the form starts empty on every opening.
 */
export function AddMemberDialog({ zones }: { zones: ZoneOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className={PAGE_ACTION_CLASS}>
            <UserPlus data-icon="inline-start" />
            Add member
          </Button>
        }
      />
      <DialogContent
        overlayClassName="bg-scrim/55"
        className="max-h-[calc(100svh-2rem)] gap-4 overflow-y-auto p-6 sm:max-w-[440px]"
      >
        <DialogHeader className="gap-1 pr-8">
          <DialogTitle className="font-heading text-lg font-bold tracking-[-0.03em]">Add member</DialogTitle>
          <DialogDescription>The member will receive SMS alerts for their home zone.</DialogDescription>
        </DialogHeader>
        <MemberForm
          zones={zones}
          layout="compact"
          onCreated={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
