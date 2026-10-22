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
}

/** Deactivates a member after a confirmation, or reactivates one directly. */
export function MemberStatusButton({ id, name, isActive }: MemberStatusButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleChange() {
    startTransition(async () => {
      const result = await setMemberActive(id, !isActive);
      if (result.success) {
        toast.success(isActive ? `${name} deactivated.` : `${name} reactivated.`);
      } else {
        toast.error(result.error);
      }
      setOpen(false);
    });
  }

  if (!isActive) {
    return (
      <Button
        variant="outline"
        className="h-11 px-4 text-base"
        disabled={pending}
        onClick={handleChange}
      >
        <UserCheck data-icon="inline-start" />
        {pending ? "Reactivating…" : "Reactivate"}
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" className="h-11 px-4 text-base" />}>
        <UserX data-icon="inline-start" />
        Deactivate
      </AlertDialogTrigger>
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
          <AlertDialogAction className="h-11 px-4" disabled={pending} onClick={handleChange}>
            {pending ? "Deactivating…" : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
