import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Broadcasts · Mi-isi Disaster Alert",
};

export default function BroadcastsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Broadcasts</h1>
        <Link href="/broadcasts/new" className={buttonVariants({ className: "h-11 px-4 text-base" })}>
          <Plus data-icon="inline-start" />
          New broadcast
        </Link>
      </div>
    </div>
  );
}
