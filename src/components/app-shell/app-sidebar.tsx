"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AppLogo } from "@/components/app-shell/app-logo";
import { NAV_ITEMS, SETTINGS_ITEM, type NavItem } from "@/components/app-shell/nav-items";
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
  badges?: Partial<Record<string, ReactNode>>;
  footer?: ReactNode;
}

interface NavMenuProps {
  items: NavItem[];
  pathname: string | null;
  badges?: AppSidebarProps["badges"];
  onNavigate: () => void;
}

const NAV_BUTTON_CLASS =
  "h-[45px] gap-3 rounded-[9px] px-[13px] text-sm font-medium text-sidebar-foreground hover:bg-white/[.07] hover:text-white active:bg-white/[.07] active:text-white data-active:bg-sidebar-accent data-active:font-medium data-active:text-white data-active:shadow-[inset_3px_0_0_var(--sidebar-indicator)] [&_svg]:size-5";

function isActiveHref(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavMenu({ items, pathname, badges, onNavigate }: NavMenuProps) {
  return (
    <SidebarMenu className="gap-1.5">
      {items.map(({ label, href, icon: Icon }) => {
        const isActive = isActiveHref(pathname, href);

        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              className={NAV_BUTTON_CLASS}
              isActive={isActive}
              render={<Link href={href} aria-current={isActive ? "page" : undefined} />}
              onClick={onNavigate}
            >
              <Icon aria-hidden="true" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              {badges?.[href]}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function ActiveNavMenu(props: Omit<NavMenuProps, "pathname">) {
  return <NavMenu {...props} pathname={usePathname()} />;
}

function NavSection(props: Omit<NavMenuProps, "pathname">) {
  return (
    <Suspense fallback={<NavMenu {...props} pathname={null} />}>
      <ActiveNavMenu {...props} />
    </Suspense>
  );
}

export function AppSidebar({ badges, footer }: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <SidebarHeader className="min-h-[82px] justify-center border-b border-sidebar-border px-6 py-0">
        <Link
          href="/dashboard"
          onClick={closeMobile}
          className="flex items-center gap-[11px] rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <AppLogo variant="sidebar" />
          <span className="flex flex-col">
            <span className="font-heading text-[17px] font-bold tracking-[-0.02em] text-white">
              MI-ISI
            </span>
            <span className="mt-px text-[11px] font-medium text-[#a9c4b2]">
              Disaster Alert System
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-3.5 pt-[25px]">
          <NavSection items={NAV_ITEMS} badges={badges} onNavigate={closeMobile} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3 border-t border-sidebar-border px-3.5 pt-2.5 pb-[18px]">
        <NavSection items={[SETTINGS_ITEM]} onNavigate={closeMobile} />
        {footer && <div className="border-t border-sidebar-border pt-1">{footer}</div>}
      </SidebarFooter>
    </Sidebar>
  );
}
