import { Plus, Upload } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Members</h1>
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/members/import"
            className={buttonVariants({ variant: "outline", className: "h-11 px-4 text-base" })}
          >
            <Upload data-icon="inline-start" />
            Import CSV
          </Link>
          <Link href="/members/new" className={buttonVariants({ className: "h-11 px-4 text-base" })}>
            <Plus data-icon="inline-start" />
            New member
          </Link>
        </div>
      </div>

      <Suspense fallback={<MemberListSkeleton />}>
        <MemberList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
