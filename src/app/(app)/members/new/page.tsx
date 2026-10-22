import type { Metadata } from "next";
import { Suspense } from "react";

import { BackToMembers } from "@/components/members/back-to-members";
import { NewMemberForm, NewMemberFormSkeleton } from "@/components/members/new-member-form";

export const metadata: Metadata = {
  title: "New member · Mi-isi Disaster Alert",
};

export default function NewMemberPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackToMembers />
        <h1 className="text-2xl font-semibold">New member</h1>
      </div>
      <Suspense fallback={<NewMemberFormSkeleton />}>
        <NewMemberForm />
      </Suspense>
    </div>
  );
}
