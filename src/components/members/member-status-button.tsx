"use client";

import { UserCheck, UserX } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setMemberActive } from "@/actions/members";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface MemberStatusButtonProps {
  id: string;
  name: string;
  isActive: boolean;
  /** Controls the Deactivate confirmation from outside, such as a row menu. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Leaves out the button, for when something else opens the confirmation. */
  hideTrigger?: boolean;
}

/**
 * Switches a member between active and inactive, with a toast for the result.
 *
 * @returns `change` (runs the switch, then `onDone`) and whether it is running.
 */
export function useMemberStatusChange(id: string, name: string, isActive: boolean) {
  const [pending, startTransition] = useTransition();

  function change(onDone?: () => void) {
    startTransition(async () => {
      const result = await setMemberActive(id, !isActive);
      if (result.success) {
        toast.success(isActive ? `${name} deactivated.` : `${name} reactivated.`);
      } else {
        toast.error(result.error);
      }
      onDone?.();
    });
  }

  return { change, pending };
}

/** Deactivates a member after a confirmation, or reactivates one directly. */
export function MemberStatusButton({ id, name, isActive, open, onOpenChange, hideTrigger }: MemberStatusButtonProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const { change, pending } = useMemberStatusChange(id, name, isActive);

  if (!isActive) {
    if (hideTrigger) return null;
    return (
      <Button variant="outline" className="h-11 px-4 text-[13px]" disabled={pending} onClick={() => change()}>
        <UserCheck data-icon="inline-start" />
        {pending ? "Reactivating…" : "Reactivate"}
      </Button>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      {!hideTrigger && (
        <AlertDialogTrigger render={<Button variant="outline" className="h-11 px-4 text-[13px]" />}>
          <UserX data-icon="inline-start" />
          Deactivate
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            They won&rsquo;t receive SMS alerts until reactivated. Their details and delivery
            history are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction className="h-11 px-4" disabled={pending} onClick={() => change(() => setOpen(false))}>
            {pending ? "Deactivating…" : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
