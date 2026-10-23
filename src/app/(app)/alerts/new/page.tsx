import type { Metadata } from "next";
import { Suspense } from "react";

import { BackToAlerts } from "@/components/alerts/back-to-alerts";
import { NewAlertForm, NewAlertFormSkeleton } from "@/components/alerts/new-alert-form";

export const metadata: Metadata = {
  title: "New alert · Mi-isi Disaster Alert",
};

export default function NewAlertPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackToAlerts />
        <h1 className="text-2xl font-semibold">New alert</h1>
      </div>
      <Suspense fallback={<NewAlertFormSkeleton />}>
        <NewAlertForm />
      </Suspense>
    </div>
  );
}
