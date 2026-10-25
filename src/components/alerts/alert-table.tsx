import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

import { HazardIconTile } from "@/components/alerts/hazard-icon-tile";
import { StatusPill } from "@/components/layout/status-pill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AlertStatus, HazardType, Severity } from "@/generated/prisma/enums";
import { formatRelativeManila } from "@/lib/datetime";
import { HAZARD_TYPES, SEVERITIES } from "@/lib/domain/hazards";
import { isCriticalActive, severityTone } from "@/lib/domain/status-tone";
import { zonesLabel } from "@/lib/domain/zones-label";


/** One alert as the log's table shows it. */
export interface AlertTableRow {
  id: string;
  title: string;
  hazardType: HazardType;
  severity: Severity;
  officialLevel: string | null;
  status: AlertStatus;
  createdAt: Date;
  zones: { name: string }[];
}

interface AlertTableProps {
  rows: AlertTableRow[];
  totalZones: number;
  /** For `Today` / `Yesterday` in the Created column. */
  now: Date;
}

/** The alert log's table; each row links to its alert. Scrolls inside its card below 760px. */
export function AlertTable({ rows, totalZones, now }: AlertTableProps) {
  return (
    <Table className="min-w-[760px]">
      <TableHeader>
        <TableRow>
          <TableHead>Alert</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Affected zones</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <span className="sr-only">Open</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((alert) => {
          const hazard = HAZARD_TYPES[alert.hazardType].label;
          const active = alert.status === "ACTIVE";
          return (
            <TableRow key={alert.id} className="relative">
              <TableCell className="h-[67px]">
                <div className="flex items-center gap-2.5">
                  <HazardIconTile type={alert.hazardType} />
                  <span className="flex flex-col gap-0.5">
                    {/* The link covers the whole row, so a click anywhere on it opens the alert. */}
                    <Link
                      href={`/alerts/${alert.id}`}
                      className="text-sm font-semibold text-[#26342b] outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/25 focus-visible:after:ring-inset dark:text-foreground"
                    >
                      {alert.title}
                    </Link>
                    <small className="text-[13px] text-[#8a958e] dark:text-muted-foreground">
                      {alert.officialLevel ? `${hazard} · ${alert.officialLevel}` : hazard}
                    </small>
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <StatusPill tone={severityTone(alert.severity)} pulse={isCriticalActive(alert.severity, alert.status)}>{SEVERITIES[alert.severity].label}</StatusPill>
              </TableCell>
              <TableCell>
                {zonesLabel(
                  alert.zones.map((zone) => zone.name),
                  totalZones,
                )}
              </TableCell>
              <TableCell>{formatRelativeManila(alert.createdAt, now)}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[13px] font-semibold",
                    active ? "text-status-clear" : "text-status-neutral",
                  )}
                >
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                  {active ? "Active" : "Resolved"}
                </span>
              </TableCell>
              <TableCell>
                <ChevronRight className="ml-auto size-4 text-[#96a198]" aria-hidden="true" />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
