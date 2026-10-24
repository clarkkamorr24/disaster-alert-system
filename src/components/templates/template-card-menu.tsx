"use client";

import { Copy, Ellipsis, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DeleteTemplateButton } from "@/components/templates/delete-template-button";
import { useDuplicateTemplate } from "@/hooks/use-duplicate-template";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** The ⋯ menu of a template card: Edit, Duplicate, and Delete (confirmed). */
export function TemplateCardMenu({ id, name }: { id: string; name: string }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { duplicate, pending } = useDuplicateTemplate(id);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for template "${name}"`}
          className="-mt-1 -mr-1.5 inline-grid size-11 shrink-0 place-items-center rounded-[7px] text-subtle-foreground outline-none hover:bg-accent hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/25 aria-expanded:bg-accent aria-expanded:text-primary sm:size-8"
        >
          <Ellipsis className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem className="min-h-11 sm:min-h-9" render={<Link href={`/templates/${id}`} />}>
            <Pencil aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11 sm:min-h-9" disabled={pending} onClick={duplicate}>
            <Copy aria-hidden="true" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="min-h-11 sm:min-h-9" onClick={() => setDeleteOpen(true)}>
            <Trash2 aria-hidden="true" />
            Delete…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteTemplateButton id={id} name={name} open={deleteOpen} onOpenChange={setDeleteOpen} hideTrigger />
    </>
  );
}
