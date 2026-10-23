import { CircleAlert, CircleCheck } from "lucide-react";

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
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 font-medium">
        <CircleCheck className="size-5 text-primary" aria-hidden="true" />
        {plural(validCount, "member")} ready to import
      </p>

      {errors.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="flex items-start gap-2 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <span>
              {plural(errors.length, "row")} can&apos;t be imported. Fix{" "}
              {errors.length === 1 ? "it" : "them"} in the spreadsheet and check the file again
              {validCount > 0 ? ", or import the ready rows now." : "."}
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
                    <TableCell className="align-top tabular-nums">{error.row}</TableCell>
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
