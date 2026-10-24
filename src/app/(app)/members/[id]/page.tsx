import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink } from "@/components/layout/back-link";
import { MemberDetail, MemberDetailSkeleton } from "@/components/members/member-detail";

export const metadata: Metadata = {
  title: "Member · Mi-isi Disaster Alert",
};

export default function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pt-[22px] pb-8">
      <BackLink href="/members" label="Members" />
      <Suspense fallback={<MemberDetailSkeleton />}>
        <MemberDetail params={params} />
      </Suspense>
    </div>
  );
}
