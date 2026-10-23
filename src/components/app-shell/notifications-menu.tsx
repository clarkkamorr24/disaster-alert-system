"use client";

import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";

import { HEADER_ICON_BUTTON } from "@/components/app-shell/header-styles";
import { SeverityDot } from "@/components/alerts/severity-dot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SEVERITIES } from "@/lib/domain/hazards";
import type { Severity } from "@/generated/prisma/enums";

export interface BellAlert {
  id: string;
  title: string;
  severity: Severity;
  /** Zone names, comma-separated. */
  zones: string;
}

interface NotificationsMenuProps {
  /** Every active alert, including those not listed. */
  total: number;
  /** Up to 5, worst severity first, then newest. */
  alerts: BellAlert[];
}

export function NotificationsMenu({ total, alerts }: NotificationsMenuProps) {
  const label = `Notifications: ${total} active alert${total === 1 ? "" : "s"}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={label} className={HEADER_ICON_BUTTON}>
        <Bell aria-hidden="true" strokeWidth={1.75} />
        {total > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-[9px] right-2.5 size-[11px] rounded-full border-2 border-card bg-[#dc2626]"
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80 max-w-[calc(100vw-32px)]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-2 text-[10px] font-bold tracking-[.08em] uppercase">
            Active alerts
          </DropdownMenuLabel>
          {alerts.length === 0 && (
            <p className="px-2.5 pb-2.5 text-sm text-muted-foreground">No active alerts.</p>
          )}
          {alerts.map((alert) => (
            <DropdownMenuItem
              key={alert.id}
              render={<Link href={`/alerts/${alert.id}`} />}
              className="min-h-11 items-start gap-2.5 px-2.5 py-2"
            >
              <SeverityDot severity={alert.severity} className="mt-1.5" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{alert.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {SEVERITIES[alert.severity].label} · {alert.zones}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/alerts?tab=active" />}
          className="h-11 px-2.5 text-xs font-bold text-link"
        >
          View all alerts
          <ChevronRight className="ml-auto" aria-hidden="true" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
