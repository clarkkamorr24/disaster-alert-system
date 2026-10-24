"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteMember } from "@/actions/members";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isRedirectError } from "@/lib/redirect-error";

interface DeleteMemberButtonProps {
  id: string;
  name: string;
  /** Controls the confirmation from outside, such as a row menu. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Leaves out the button, for when something else opens the confirmation. */
  hideTrigger?: boolean;
  /** Stays on the current page (keeping the list's filters) instead of going to `/members`. */
  stay?: boolean;
}

/** Permanently deletes a member once `DELETE` is typed into the confirmation. */
export function DeleteMemberButton({ id, name, open, onOpenChange, hideTrigger, stay }: DeleteMemberButtonProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, startTransition] = useTransition();
  const isOpen = open ?? innerOpen;

  function handleOpenChange(next: boolean) {
    (onOpenChange ?? setInnerOpen)(next);
    if (!next) setConfirmation("");
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        const result = await deleteMember(id, confirmation, { stay });
        if (!result.success) {
          toast.error(result.error);
        } else {
          toast.success(`${name} deleted.`);
          handleOpenChange(false);
        }
      } catch (error) {
        // Without `stay`, a successful delete redirects to /members; let Next.js finish the navigation.
        if (isRedirectError(error)) toast.success(`${name} deleted.`);
        throw error;
      }
    });
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <AlertDialogTrigger render={<Button variant="destructive" className="h-11 px-4 text-[13px]" />}>
          <Trash2 data-icon="inline-start" />
          Delete permanently
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name} permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            Use this only when the member asked to be removed. Their details are erased and
            can&rsquo;t be restored. Past delivery reports keep their name and phone number.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`delete-member-confirmation-${id}`}>Type DELETE to confirm</Label>
          <Input
            id={`delete-member-confirmation-${id}`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="h-11"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="h-11 px-4"
            disabled={pending || confirmation !== "DELETE"}
            onClick={handleDelete}
          >
            {pending ? "Deleting…" : "Delete permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
