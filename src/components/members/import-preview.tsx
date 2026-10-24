import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "cn";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MemberImportPreview } from "@/types/member";

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** The result of checking a member CSV: how many rows are ready, and why the rest fail. */
export function ImportPreview({ validCount, errors }: MemberImportPreview) {
  const ready = validCount > 0;
  return (
    <div className="flex flex-col gap-4">
      <p
        className={cn(
          "flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-sm font-semibold",
          ready
            ? "border-accent-border bg-accent text-status-clear"
            : "border-border bg-muted text-muted-foreground",
        )}
      >
        {ready ? (
          <CircleCheck className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <CircleAlert className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        )}
        {plural(validCount, "member")} ready to import
      </p>

      {errors.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="flex items-start gap-2 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" strokeWidth={1.75} aria-hidden="true" />
            <span>
              {plural(errors.length, "row")} can&apos;t be imported. Fix{" "}
              {errors.length === 1 ? "it" : "them"} in the spreadsheet and check the file again
              {ready ? ", or import the ready rows now." : "."}
            </span>
          </p>
          <div className="max-h-96 overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead>Problem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.map((error) => (
                  <TableRow key={error.row}>
                    <TableCell className="h-11 font-semibold text-foreground tabular-nums">{error.row}</TableCell>
                    <TableCell className="whitespace-normal">{error.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
