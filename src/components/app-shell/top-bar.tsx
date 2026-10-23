import { Plus, Siren } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-sidebar px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-2 size-11" />
        <div className="flex min-w-0 items-center gap-2 md:hidden">
          <Siren className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate font-semibold">Mi-isi Disaster Alert</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Link href="/alerts/new" className={buttonVariants({ className: "h-11 px-3 text-sm" })}>
          <Plus data-icon="inline-start" />
          New alert
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
