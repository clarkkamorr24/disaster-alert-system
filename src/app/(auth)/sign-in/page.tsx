import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppLogo } from "@/components/app-shell/app-logo";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentOfficer } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Sign in · Mi-isi Disaster Alert",
};

// A stale session (password changed elsewhere) gets the form, not a redirect,
// so it cannot loop with requireOfficer() sending it back here.
async function SignInGate() {
  if (await getCurrentOfficer()) redirect("/dashboard");
  return <SignInForm />;
}

export default function SignInPage() {
  return (
    <div className="flex w-full max-w-[380px] flex-col gap-6">
      <div className="flex justify-center items-center gap-[11px]">
        <AppLogo variant="brand" />
        <div>
          <p className="font-heading text-[17px] font-bold tracking-[-0.02em] uppercase">Mi-isi</p>
          <p className="text-xs text-muted-foreground">Disaster Alert System</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-6">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-[-0.03em] text-center">Officer Sign In</h1>
        </div>
        <Suspense fallback={<Skeleton className="h-[226px]" />}>
          <SignInGate />
        </Suspense>
      </div>
    </div>
  );
}
