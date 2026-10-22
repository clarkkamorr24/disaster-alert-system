"use client";

import { Siren } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { NAV_ITEMS } from "@/components/app-shell/nav-items";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  footer?: ReactNode;
}

interface NavMenuProps {
  pathname: string | null;
  onNavigate: () => void;
}

function isActiveHref(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavMenu({ pathname, onNavigate }: NavMenuProps) {
  return (
    <SidebarMenu>
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive = isActiveHref(pathname, href);

        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              className="h-11"
              isActive={isActive}
              tooltip={label}
              render={<Link href={href} aria-current={isActive ? "page" : undefined} />}
              onClick={onNavigate}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

// usePathname suspends on routes with unknown dynamic params under cacheComponents,
// so it lives in its own Suspense boundary with an unhighlighted fallback.
function ActiveNavMenu({ onNavigate }: Pick<NavMenuProps, "onNavigate">) {
  return <NavMenu pathname={usePathname()} onNavigate={onNavigate} />;
}

export function AppSidebar({ footer }: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              onClick={closeMobile}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
                <Siren aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-semibold">Mi-isi Disaster Alert</span>
                <span className="truncate text-xs text-muted-foreground">
                  Mi-isi Farmers Association
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <Suspense fallback={<NavMenu pathname={null} onNavigate={closeMobile} />}>
            <ActiveNavMenu onNavigate={closeMobile} />
          </Suspense>
        </SidebarGroup>
      </SidebarContent>
      {footer && <SidebarFooter>{footer}</SidebarFooter>}
    </Sidebar>
  );
}
