import {
  FileText,
  LayoutDashboard,
  Map,
  Send,
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

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Alerts", href: "/alerts", icon: TriangleAlert },
  { label: "Zones", href: "/zones", icon: Map },
  { label: "Members", href: "/members", icon: Users },
  { label: "Broadcasts", href: "/broadcasts", icon: Send },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];
