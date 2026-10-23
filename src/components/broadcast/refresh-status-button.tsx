"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { refreshBroadcastStatus } from "@/actions/broadcasts";
import { Button } from "@/components/ui/button";

/** Pulls the latest delivery statuses from UniSMS for one broadcast. */
export function RefreshStatusButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      const result = await refreshBroadcastStatus(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const { updated } = result.data;
      toast.success(
        updated === 0 ? "Statuses are up to date." : `Updated ${updated} ${updated === 1 ? "recipient" : "recipients"}.`,
      );
    });
  }

  return (
    <Button variant="outline" disabled={pending} onClick={handleRefresh} className="h-11 px-4 text-base">
      <RefreshCw data-icon="inline-start" className={pending ? "animate-spin" : undefined} />
      {pending ? "Refreshing…" : "Refresh status"}
    </Button>
  );
}
