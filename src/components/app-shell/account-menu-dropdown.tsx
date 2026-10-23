"use client";

import { ChevronRight, LogOut, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";

import { signOutAction } from "@/actions/auth";
import { OfficerAvatar } from "@/components/app-shell/officer-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";

export interface AccountMenuProps {
  name: string;
  email: string;
  initials: string;
}

interface AccountMenuContentProps extends Pick<AccountMenuProps, "name" | "email"> {
  side: ComponentProps<typeof DropdownMenuContent>["side"];
  align: ComponentProps<typeof DropdownMenuContent>["align"];
  /** Runs when Settings is chosen, so the mobile drawer can close. */
  onNavigate?: () => void;
}

/** The account menu's items, shared by the sidebar footer and the header chip. */
export function AccountMenuContent({ name, email, side, align, onNavigate }: AccountMenuContentProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenuContent side={side} align={align} sideOffset={8} className="w-60">
      <DropdownMenuGroup>
        <DropdownMenuLabel className="flex flex-col text-sm">
          <span className="truncate font-medium text-foreground">{name}</span>
          <span className="truncate text-xs font-normal">{email}</span>
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="h-11" render={<Link href="/settings" />} onClick={onNavigate}>
        <Settings aria-hidden="true" />
        Settings
      </DropdownMenuItem>
      <DropdownMenuItem
        className="h-11"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {/* Both labels render; CSS picks one, so server and client markup match. */}
        <Moon aria-hidden="true" className="dark:hidden" />
        <span className="dark:hidden">Dark mode</span>
        <Sun aria-hidden="true" className="hidden dark:block" />
        <span className="hidden dark:inline">Light mode</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <form action={signOutAction}>
        <DropdownMenuItem
          className="h-11 w-full"
          nativeButton
          render={<button type="submit" />}
          closeOnClick={false}
        >
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </form>
    </DropdownMenuContent>
  );
}

/** The officer footer at the bottom of the sidebar; opens the account menu. */
export function AccountMenuDropdown({ name, email, initials }: AccountMenuProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-3 text-left text-[#c6d8cb] outline-none hover:bg-white/[.07] focus-visible:ring-2 focus-visible:ring-sidebar-ring data-popup-open:bg-white/[.07]"
      >
        <OfficerAvatar initials={initials} className="size-9" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold text-white">{name}</span>
          <span className="truncate text-[11px] text-[#91ae9a]">Association officer</span>
        </span>
        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
      </DropdownMenuTrigger>
      <AccountMenuContent
        name={name}
        email={email}
        side={isMobile ? "top" : "right"}
        align="end"
        onNavigate={closeMobile}
      />
    </DropdownMenu>
  );
}
