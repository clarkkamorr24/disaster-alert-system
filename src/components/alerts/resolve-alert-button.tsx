"use client";

import { CircleCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { resolveAlert } from "@/actions/alerts";
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

interface ResolveAlertButtonProps {
  id: string;
}

/** Marks an alert resolved after a confirmation. */
export function ResolveAlertButton({ id }: ResolveAlertButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleResolve() {
    startTransition(async () => {
      const result = await resolveAlert(id);
      if (result.success) toast.success("Alert resolved.");
      else toast.error(result.error);
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" className="h-11 gap-2 px-4 text-[13px]" />}>
        <CircleCheck data-icon="inline-start" />
        Mark resolved
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark this alert as resolved?</AlertDialogTitle>
          <AlertDialogDescription>It will stop coloring the map.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 px-4" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction className="h-11 px-4" disabled={pending} onClick={handleResolve}>
            {pending ? "Resolving…" : "Mark resolved"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
