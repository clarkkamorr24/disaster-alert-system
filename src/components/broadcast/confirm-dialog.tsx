"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberCount: number;
  zoneNames: string[];
  totalCredits: number;
  pending: boolean;
  onConfirm: () => void;
}

/** Asks "Send to N members in: Zone A, Zone B?" before a broadcast goes out. */
export function ConfirmSendDialog({
  open,
  onOpenChange,
  memberCount,
  zoneNames,
  totalCredits,
  pending,
  onConfirm,
}: ConfirmSendDialogProps) {
  return (
    // Stays open while sending, so the officer sees it is still working.
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Send to {memberCount} {memberCount === 1 ? "member" : "members"} in: {zoneNames.join(", ")}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This uses about {totalCredits.toLocaleString("en-PH")}{" "}
            {totalCredits === 1 ? "credit" : "credits"} and can&rsquo;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction className="h-11 px-4" disabled={pending} onClick={onConfirm}>
            {pending ? "Sending…" : "Send"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
