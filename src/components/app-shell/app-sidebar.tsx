"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AppLogo } from "@/components/app-shell/app-logo";
import { NAV_ITEMS, type NavItem } from "@/components/app-shell/nav-items";
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

/** Collapsed (`collapsible=icon`): a 44px icon-only square, with the label in a tooltip. */
const NAV_BUTTON_CLASS =
  "relative h-[45px] gap-3 rounded-[9px] px-[13px] group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! text-sm font-medium text-sidebar-foreground hover:bg-white/[.07] hover:text-white active:bg-white/[.07] active:text-white data-active:bg-sidebar-accent data-active:font-medium data-active:text-white data-active:shadow-[inset_3px_0_0_var(--sidebar-indicator)] [&_svg]:size-5";

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
              tooltip={label}
              onClick={onNavigate}
            >
              <Icon aria-hidden="true" strokeWidth={1.75} />
              <span className="flex-1 whitespace-nowrap group-data-[collapsible=icon]:hidden">{label}</span>
              {badges?.[href] && (
                // Collapsed, the badge shrinks onto the icon's top-right corner.
                <span className="group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-0 group-data-[collapsible=icon]:right-0 group-data-[collapsible=icon]:origin-top-right group-data-[collapsible=icon]:scale-75">
                  {badges[href]}
                </span>
              )}
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
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="min-h-[82px] justify-center border-b border-sidebar-border px-6 py-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <Link
          href="/dashboard"
          onClick={closeMobile}
          className="flex min-w-0 items-center gap-[11px] rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <AppLogo variant="sidebar" />
          <span className="flex flex-col whitespace-nowrap group-data-[collapsible=icon]:sr-only">
            <span className="font-heading text-[17px] font-bold tracking-[-0.02em] text-white">
              MI-ISI
            </span>
            <span className="mt-px text-[13px] font-medium text-[#a9c4b2]">
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
      {footer && (
        <SidebarFooter className="border-t border-sidebar-border px-3.5 pt-2.5 pb-[18px] group-data-[collapsible=icon]:items-center">
          {footer}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
