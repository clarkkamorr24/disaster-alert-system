"use client";

import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";

import { signOutAction } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AccountMenuDropdownProps {
  name: string;
  email: string;
  initials: string;
}

export function AccountMenuDropdown({ name, email, initials }: AccountMenuDropdownProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" aria-label={`Account menu for ${name}`} />}
          >
            <Avatar>
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </span>
            <ChevronsUpDown className="ml-auto" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={8}
            className="min-w-56"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col text-sm">
                <span className="truncate font-medium text-foreground">{name}</span>
                <span className="truncate text-xs font-normal">{email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="h-11"
              render={<Link href="/settings" />}
              onClick={closeMobile}
            >
              <Settings aria-hidden="true" />
              Settings
            </DropdownMenuItem>
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
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
