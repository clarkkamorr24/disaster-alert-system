import Link from "next/link";

import { TemplateCardMenu } from "@/components/templates/template-card-menu";
import { TemplateTag, TemplateTile, type TemplateCardProps } from "@/components/templates/template-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usageLabel } from "@/lib/templates/usage";

/** Templates as table rows (tile, name and tag, message, usage, ⋯ menu), the List view of the templates page. */
export function TemplateTable({ templates }: { templates: TemplateCardProps[] }) {
  return (
    <Table className="min-w-[720px] text-[13px]">
      <TableHeader>
        <TableRow>
          <TableHead className="px-[18px]">Template</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Usage</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => (
          <TableRow key={template.id}>
            <TableCell className="w-[280px] px-[18px] py-3">
              <div className="flex items-center gap-3">
                <TemplateTile hazardType={template.hazardType} />
                <div className="flex min-w-0 flex-col items-start gap-1">
                  <Link
                    href={`/templates/${template.id}`}
                    className="font-semibold break-words whitespace-normal text-title-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/25"
                  >
                    {template.name}
                  </Link>
                  <TemplateTag hazardType={template.hazardType} />
                </div>
              </div>
            </TableCell>
            <TableCell className="max-w-[420px] py-3 whitespace-normal">
              <p className="line-clamp-2 break-words text-muted-foreground">{template.body}</p>
            </TableCell>
            <TableCell className="text-subtle-foreground">{usageLabel(template.usageCount)}</TableCell>
            <TableCell className="w-12 pr-3 text-right">
              <TemplateCardMenu id={template.id} name={template.name} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
