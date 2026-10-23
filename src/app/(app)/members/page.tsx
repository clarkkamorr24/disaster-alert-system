import { Plus, Upload } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PAGE_ACTION_CLASS, PageHeader } from "@/components/layout/page-header";
import { MemberList, MemberListSkeleton } from "@/components/members/member-list";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Members · Mi-isi Disaster Alert",
};

export default function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        eyebrow="Association records"
        title="Members"
        description="Manage farmer contact details, home zones, and consent records."
        action={
          <>
            <Link
              href="/members/import"
              className={buttonVariants({ variant: "outline", className: PAGE_ACTION_CLASS })}
            >
              <Upload data-icon="inline-start" />
              Import CSV
            </Link>
            <Link href="/members/new" className={buttonVariants({ className: PAGE_ACTION_CLASS })}>
              <Plus data-icon="inline-start" />
              Add member
            </Link>
          </>
        }
      />

      <Suspense fallback={<MemberListSkeleton />}>
        <MemberList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
