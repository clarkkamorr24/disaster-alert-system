"use client";

import { ChevronDown } from "lucide-react";

import { AccountMenuContent, type AccountMenuProps } from "@/components/app-shell/account-menu-dropdown";
import { OfficerAvatar } from "@/components/app-shell/officer-avatar";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** The officer chip at the right of the header (from `md`); opens the account menu. */
export function OfficerChipMenu({ name, email, initials }: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className="flex h-11 min-w-[155px] items-center gap-[9px] rounded-lg pr-1 pl-2 text-left outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/25 data-popup-open:bg-accent"
      >
        <OfficerAvatar initials={initials} className="size-[34px]" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="max-w-40 truncate text-xs font-semibold text-[#243229] dark:text-foreground">
            {name}
          </span>
          <span className="text-[11px] text-[#7d8b82] dark:text-muted-foreground">Officer</span>
        </span>
        <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
      </DropdownMenuTrigger>
      <AccountMenuContent name={name} email={email} side="bottom" align="end" />
    </DropdownMenu>
  );
}
