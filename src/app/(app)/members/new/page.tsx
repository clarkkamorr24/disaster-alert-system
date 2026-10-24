import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { NewMemberForm, NewMemberFormSkeleton } from "@/components/members/new-member-form";

export const metadata: Metadata = {
  title: "New member · Mi-isi Disaster Alert",
};

export default function NewMemberPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col pb-8">
      <div className="pt-[22px]">
        <BackLink href="/members" label="Members" />
      </div>
      <PageHeader
        eyebrow="Association records"
        title="Add member"
        description="The member will receive SMS alerts for their home zone."
      />
      <Suspense fallback={<NewMemberFormSkeleton />}>
        <NewMemberForm />
      </Suspense>
    </div>
  );
}
