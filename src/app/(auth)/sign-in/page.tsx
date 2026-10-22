import type { Metadata } from "next";
import { Siren } from "lucide-react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in · Mi-isi Disaster Alert",
};

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
        <SignInForm />
      </CardContent>
    </Card>
  );
}
