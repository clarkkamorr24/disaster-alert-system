import type { Metadata } from "next";
import { Suspense } from "react";

import { BackToMembers } from "@/components/members/back-to-members";
import { MemberDetail, MemberDetailSkeleton } from "@/components/members/member-detail";

export const metadata: Metadata = {
  title: "Member · Mi-isi Disaster Alert",
};

export default function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <BackToMembers />
      <Suspense fallback={<MemberDetailSkeleton />}>
        <MemberDetail params={params} />
      </Suspense>
    </div>
  );
}
