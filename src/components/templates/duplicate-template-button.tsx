"use client";

import { Copy } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { duplicateTemplate } from "@/actions/templates";
import { Button } from "@/components/ui/button";

/** Duplicates a template; the action revalidates `/templates`, so the new card appears in place. */
export function useDuplicateTemplate(id: string) {
  const [pending, startTransition] = useTransition();

  function duplicate() {
    startTransition(async () => {
      const result = await duplicateTemplate(id);
      if (result.success) toast.success("Template duplicated.");
      else toast.error(result.error);
    });
  }

  return { duplicate, pending };
}

/** The template card's Duplicate button. */
export function DuplicateTemplateButton({ id, name }: { id: string; name: string }) {
  const { duplicate, pending } = useDuplicateTemplate(id);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={duplicate}
      aria-label={`Duplicate template "${name}"`}
      className="h-[34px] gap-1.5 px-2.5 text-[11px]"
    >
      <Copy className="size-3.5" aria-hidden="true" />
      {pending ? "Duplicating…" : "Duplicate"}
    </Button>
  );
}
