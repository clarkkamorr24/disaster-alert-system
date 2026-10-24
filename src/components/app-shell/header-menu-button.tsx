"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { HEADER_ICON_BUTTON } from "@/components/app-shell/header-styles";
import { useSidebar } from "@/components/ui/sidebar";

/** Opens the sidebar drawer below `md`. */
export function HeaderMenuButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <button type="button" className={`${HEADER_ICON_BUTTON} md:hidden`} aria-label="Open menu" onClick={toggleSidebar}>
      <Menu aria-hidden="true" strokeWidth={1.75} />
    </button>
  );
}

/** Collapses the sidebar to icons and expands it again, from `md` (also Ctrl/⌘ B). */
export function SidebarToggleButton() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={label}
      title={label}
      aria-expanded={!collapsed}
      aria-keyshortcuts="Control+B Meta+B"
      className={`${HEADER_ICON_BUTTON} hidden md:grid -ml-4`}
    >
      <Icon aria-hidden="true" strokeWidth={1.75} />
    </button>
  );
}
