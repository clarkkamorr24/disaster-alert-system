"use client";

import { ChevronUp, LogOut, Moon, Settings, Sun } from "lucide-react";
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

interface AccountMenuProps {
  name: string;
  email: string;
  initials: string;
}

interface AccountMenuContentProps extends Pick<AccountMenuProps, "name" | "email"> {
  side: ComponentProps<typeof DropdownMenuContent>["side"];
  align: ComponentProps<typeof DropdownMenuContent>["align"];
  className?: string;
  /** Runs when Settings is chosen, so the mobile drawer can close. */
  onNavigate?: () => void;
}

/** The account menu's items: the officer, Settings, the theme toggle, and Sign out. */
function AccountMenuContent({ name, email, side, align, className, onNavigate }: AccountMenuContentProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenuContent side={side} align={align} sideOffset={8} className={className}>
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

/**
 * The officer footer at the bottom of the sidebar. Its menu opens above it at
 * the button's width; with the sidebar collapsed to icons, the button is just
 * the avatar and the menu opens to its right.
 */
export function AccountMenuDropdown({ name, email, initials }: AccountMenuProps) {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${name}`}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-3 text-left text-[#c6d8cb] outline-none hover:bg-white/[.07] focus-visible:ring-2 focus-visible:ring-sidebar-ring data-popup-open:bg-white/[.07] group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
      >
        <OfficerAvatar initials={initials} className="size-9 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
          <span className="truncate text-[13px] font-semibold text-white">{name}</span>
          <span className="truncate text-[11px] text-[#91ae9a]">Association officer</span>
        </span>
        <ChevronUp className="size-4 shrink-0 group-data-[collapsible=icon]:hidden" aria-hidden="true" />
      </DropdownMenuTrigger>
      <AccountMenuContent
        name={name}
        email={email}
        side={collapsed ? "right" : "top"}
        align={collapsed ? "end" : "start"}
        className={collapsed ? "w-60" : undefined}
        onNavigate={closeMobile}
      />
    </DropdownMenu>
  );
}
