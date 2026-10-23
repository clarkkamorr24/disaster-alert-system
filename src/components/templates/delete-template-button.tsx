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
  /** Show only the trash icon, for list rows. */
  compact?: boolean;
}

export function DeleteTemplateButton({ id, name, compact = false }: DeleteTemplateButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

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
    <AlertDialog open={open} onOpenChange={setOpen}>
      {compact ? (
        <AlertDialogTrigger
          render={<Button variant="outline" className="size-11" aria-label={`Delete template "${name}"`} />}
        >
          <Trash2 aria-hidden="true" />
        </AlertDialogTrigger>
      ) : (
        <AlertDialogTrigger render={<Button variant="destructive" className="h-11 px-4 text-base" />}>
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
