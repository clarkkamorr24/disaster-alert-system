"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteTemplate } from "@/actions/templates";
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
import { isRedirectError } from "@/lib/redirect-error";

interface DeleteTemplateButtonProps {
  id: string;
  name: string;
  /** Controls the confirmation from outside, such as a card menu. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Leaves out the button, for when something else opens the confirmation. */
  hideTrigger?: boolean;
}

/** Deletes a template after a confirmation, then goes to `/templates`. */
export function DeleteTemplateButton({ id, name, open, onOpenChange, hideTrigger }: DeleteTemplateButtonProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isOpen = open ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;

  function handleDelete() {
    startTransition(async () => {
      try {
        const result = await deleteTemplate(id);
        if (!result.success) {
          toast.error(result.error);
          setOpen(false);
        }
      } catch (error) {
        // A successful delete redirects to /templates; let Next.js finish the navigation.
        if (isRedirectError(error)) toast.success(`Template "${name}" deleted.`);
        throw error;
      }
    });
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      {!hideTrigger && (
        <AlertDialogTrigger render={<Button variant="destructive" className="h-11 px-4 text-[13px]" />}>
          <Trash2 data-icon="inline-start" />
          Delete template
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete template &quot;{name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This can&rsquo;t be undone. Messages already sent with it are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="h-11 px-4"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
