import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { AddMemberButton, AddMemberButtonFallback } from "@/components/members/add-member-button";
import { MemberList, MemberListSkeleton } from "@/components/members/member-list";

export const metadata: Metadata = {
  title: "Members · Mi-isi Disaster Alert",
};

export default function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="w-full pb-8">
      <PageHeader
        eyebrow="Association records"
        title="Members"
        description="Manage farmer contact details, home zones, and consent records."
        action={
          <Suspense fallback={<AddMemberButtonFallback />}>
            <AddMemberButton />
          </Suspense>
        }
      />

      <Suspense fallback={<MemberListSkeleton />}>
        <MemberList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
