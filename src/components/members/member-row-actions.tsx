"use client";

import { Ellipsis, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DeleteMemberButton } from "@/components/members/delete-member-button";
import { MemberStatusButton, useMemberStatusChange } from "@/components/members/member-status-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MemberRowActionsProps {
  id: string;
  name: string;
  isActive: boolean;
}

/**
 * The ⋯ menu of a member row: Edit, Deactivate (confirmed) or Activate (direct),
 * and Delete (typed `DELETE` confirmation).
 */
export function MemberRowActions({ id, name, isActive }: MemberRowActionsProps) {
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { change, pending } = useMemberStatusChange(id, name, isActive);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${name}`}
          className="inline-grid size-11 place-items-center rounded-[7px] text-subtle-foreground outline-none hover:bg-accent hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/25 aria-expanded:bg-accent aria-expanded:text-primary sm:size-8"
        >
          <Ellipsis className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem className="min-h-11 sm:min-h-9" render={<Link href={`/members/${id}`} />}>
            <Pencil aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          {isActive ? (
            <DropdownMenuItem className="min-h-11 sm:min-h-9" onClick={() => setDeactivateOpen(true)}>
              <UserX aria-hidden="true" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="min-h-11 sm:min-h-9" disabled={pending} onClick={() => change()}>
              <UserCheck aria-hidden="true" />
              Activate
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-11 sm:min-h-9"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            Delete…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isActive && (
        <MemberStatusButton
          id={id}
          name={name}
          isActive
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
          hideTrigger
        />
      )}
      <DeleteMemberButton id={id} name={name} open={deleteOpen} onOpenChange={setDeleteOpen} hideTrigger stay />
    </>
  );
}
