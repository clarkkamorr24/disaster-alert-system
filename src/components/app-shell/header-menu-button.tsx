"use client";

import { Menu } from "lucide-react";

import { HEADER_ICON_BUTTON } from "@/components/app-shell/header-styles";
import { useSidebar } from "@/components/ui/sidebar";

/** Opens the sidebar drawer below `md`. */
export function HeaderMenuButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <button type="button" className={HEADER_ICON_BUTTON} aria-label="Open menu" onClick={toggleSidebar}>
      <Menu aria-hidden="true" strokeWidth={1.75} />
    </button>
  );
}
