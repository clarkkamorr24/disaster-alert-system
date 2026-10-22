import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountCard } from "@/components/settings/account-card";
import { PasswordChangedToast } from "@/components/settings/password-changed-toast";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Settings · Mi-isi Disaster Alert",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Suspense fallback={null}>
        <PasswordChangedToast />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-150 rounded-xl" />}>
        <AccountCard />
      </Suspense>

      {/* SMS card goes here (spec 14: driver, sender ID, credit balance, webhook URL). */}
    </div>
  );
}
