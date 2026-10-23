import { Download } from "lucide-react";
import type { Metadata } from "next";

import { BackToMembers } from "@/components/members/back-to-members";
import { ImportForm } from "@/components/members/import-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Import members · Mi-isi Disaster Alert",
};

export default function ImportMembersPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackToMembers />
        <h1 className="text-2xl font-semibold">Import members</h1>
        <p className="text-muted-foreground">
          Fill in the CSV template, one member per row, then check the file. Zone names must match
          a zone under Zones. Rows with problems are listed so you can fix them; only new numbers
          are added.
        </p>
        <a
          href="/downloads/members-template.csv"
          download
          className={buttonVariants({ variant: "link", className: "h-11 self-start px-0 text-base" })}
        >
          <Download data-icon="inline-start" />
          Download the CSV template
        </a>
      </div>
      <Card>
        <CardContent>
          <ImportForm />
        </CardContent>
      </Card>
    </div>
  );
}
