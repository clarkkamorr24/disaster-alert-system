import { Check, Phone } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";

import { MemberRowActions } from "@/components/members/member-row-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatManilaDate } from "@/lib/datetime";
import { formatPhoneForDisplay } from "@/lib/domain/phone";
import { initialsOf } from "@/lib/initials";

/** One member as the registry table shows it. */
export interface MemberTableRow {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  crops: string | null;
  isActive: boolean;
  consentAt: Date;
  zone: { name: string };
}

/** The member registry table with a ⋯ menu per row. Scrolls inside its card below 850px. */
export function MemberTable({ rows }: { rows: MemberTableRow[] }) {
  return (
    <Table className="min-w-[850px]">
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Mobile number</TableHead>
          <TableHead>Home zone</TableHead>
          <TableHead>Crops</TableHead>
          <TableHead>Consent recorded</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((member) => {
          const name = `${member.firstName} ${member.lastName}`;
          return (
            <TableRow key={member.id}>
              <TableCell className="h-[67px]">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-[35px] after:hidden" aria-hidden="true">
                    <AvatarFallback className="bg-avatar text-[10px] font-bold text-avatar-foreground">
                      {initialsOf(name)}
                    </AvatarFallback>
                  </Avatar>
                  <Link
                    href={`/members/${member.id}`}
                    className="text-xs font-semibold text-title-foreground hover:text-primary hover:underline"
                  >
                    {name}
                  </Link>
                </div>
              </TableCell>
              <TableCell>
                <a
                  href={`tel:${member.phone}`}
                  className="inline-flex min-h-11 items-center gap-1.5 tabular-nums hover:text-primary hover:underline"
                >
                  <Phone className="size-[15px]" strokeWidth={1.75} aria-hidden="true" />
                  {formatPhoneForDisplay(member.phone)}
                </a>
              </TableCell>
              <TableCell>{member.zone.name}</TableCell>
              <TableCell>{member.crops ?? "—"}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-status-clear">
                  <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
                  {formatManilaDate(member.consentAt)}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[13px] font-semibold",
                    member.isActive ? "text-status-clear" : "text-status-neutral",
                  )}
                >
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <MemberRowActions id={member.id} name={name} isActive={member.isActive} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
