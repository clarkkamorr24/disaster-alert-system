import { MessageSquareText, Pencil } from "lucide-react";
import Link from "next/link";

import { HazardBadge } from "@/components/alerts/hazard-badge";
import { DeleteTemplateButton } from "@/components/templates/delete-template-button";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HazardType } from "@/generated/prisma/enums";
import { requireOfficer } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";

const SNIPPET_LENGTH = 80;

function snippet(body: string): string {
  return body.length > SNIPPET_LENGTH ? `${body.slice(0, SNIPPET_LENGTH).trimEnd()}…` : body;
}

function HazardCell({ type }: { type: HazardType | null }) {
  if (!type) return <span className="text-sm text-muted-foreground">Any hazard</span>;
  return <HazardBadge type={type} />;
}

function EditLink({ id, name }: { id: string; name: string }) {
  return (
    <Link
      href={`/templates/${id}`}
      aria-label={`Edit template "${name}"`}
      className={buttonVariants({ variant: "outline", className: "h-11 px-4 text-base" })}
    >
      <Pencil data-icon="inline-start" />
      Edit
    </Link>
  );
}

/** Every template with its hazard and the start of its message: a table from `md` up, cards below. Render inside `<Suspense>`. */
export async function TemplateList() {
  await requireOfficer();

  const templates = await prisma.messageTemplate.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, hazardType: true, body: true },
  });

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
        <MessageSquareText className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">No templates yet. Add one to send warnings faster.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden rounded-xl border md:block">
        <Table className="text-base">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Hazard</TableHead>
              <TableHead className="px-4">Message</TableHead>
              <TableHead className="px-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="px-4 py-3 align-top">
                  <Link
                    href={`/templates/${template.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {template.name}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3 align-top">
                  <HazardCell type={template.hazardType} />
                </TableCell>
                <TableCell className="px-4 py-3 align-top text-sm whitespace-normal text-muted-foreground">
                  {snippet(template.body)}
                </TableCell>
                <TableCell className="px-4 py-3 align-top">
                  <div className="flex justify-end gap-2">
                    <EditLink id={template.id} name={template.name} />
                    <DeleteTemplateButton id={template.id} name={template.name} compact />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {templates.map((template) => (
          <li key={template.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <Link
              href={`/templates/${template.id}`}
              className="flex min-h-11 items-center font-medium text-primary hover:underline"
            >
              {template.name}
            </Link>
            <HazardCell type={template.hazardType} />
            <p className="text-sm break-words text-muted-foreground">{snippet(template.body)}</p>
            <div className="flex gap-2">
              <EditLink id={template.id} name={template.name} />
              <DeleteTemplateButton id={template.id} name={template.name} compact />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Placeholder while {@link TemplateList} loads. */
export function TemplateListSkeleton() {
  return <Skeleton className="h-48 rounded-xl" />;
}
