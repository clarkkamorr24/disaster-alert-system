import {
  FileText,
  LayoutGrid,
  Map,
  MessageSquareText,
  Settings,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** The sidebar's links, in order. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Alerts", href: "/alerts", icon: TriangleAlert },
  { label: "Zones", href: "/zones", icon: Map },
  { label: "Members", href: "/members", icon: Users },
  { label: "Broadcasts", href: "/broadcasts", icon: MessageSquareText },
  { label: "Templates", href: "/templates", icon: FileText },
];

/** Not in the sidebar (the account menu links to it); listed as a page in Search. */
export const SETTINGS_ITEM: NavItem = { label: "Settings", href: "/settings", icon: Settings };
