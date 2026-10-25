import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { AccountCard } from "@/components/settings/account-card";
import { PasswordChangedToast } from "@/components/settings/password-changed-toast";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Settings · Mi-isi Disaster Alert",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description=""
      />

      <Suspense fallback={null}>
        <PasswordChangedToast />
      </Suspense>

      <div className="flex flex-col gap-6">
        <Suspense fallback={<Skeleton className="h-150 rounded-xl" />}>
          <AccountCard />
        </Suspense>
      </div>
    </div>
  );
}
