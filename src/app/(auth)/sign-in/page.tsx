import type { Metadata } from "next";
import { Siren } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full max-w-sm border-t-4 border-t-primary">
      <CardHeader className="justify-items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Siren className="size-6" aria-hidden="true" />
        </div>
        <CardTitle className="text-lg font-semibold">
          <h1>Mi-isi Disaster Alert</h1>
        </CardTitle>
        <CardDescription>Officer sign-in</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-55" />}>
          <SignInGate />
        </Suspense>
      </CardContent>
    </Card>
  );
}
