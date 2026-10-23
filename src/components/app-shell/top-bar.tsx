import { Suspense } from "react";

import { OfficerChip } from "@/components/app-shell/account-menu";
import { AppLogo } from "@/components/app-shell/app-logo";
import { HeaderMenuButton } from "@/components/app-shell/header-menu-button";
import {
  NotificationsBell,
  NotificationsBellFallback,
} from "@/components/app-shell/notifications-bell";
import { SearchButton } from "@/components/app-shell/search-button";
import { Skeleton } from "@/components/ui/skeleton";

/** Sticky 64px header: menu + logo below `md`, then search, notifications, and the officer chip. */
export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2.5 border-b border-[#e1e7e3] bg-white/92 px-[clamp(16px,2.4vw,32px)] backdrop-blur-md dark:border-border dark:bg-card/92">
      <div className="flex min-w-0 items-center gap-2.5 md:hidden">
        <HeaderMenuButton />
        <span className="flex min-w-0 items-center gap-2 font-heading font-bold text-[#183323] dark:text-foreground">
          <AppLogo variant="brand" size="sm" />
          Mi-isi
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <SearchButton />
        <Suspense fallback={<NotificationsBellFallback />}>
          <NotificationsBell />
        </Suspense>
        <div className="ml-[3px] hidden border-l border-[#e3e8e5] pl-3 md:block dark:border-border">
          <Suspense fallback={<Skeleton className="h-9 w-40" />}>
            <OfficerChip />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
