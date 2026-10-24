import { Plus } from "lucide-react";
import Link from "next/link";

import { AppLogo } from "@/components/app-shell/app-logo";
import { HeaderMenuButton, SidebarToggleButton } from "@/components/app-shell/header-menu-button";
import { SearchButton } from "@/components/app-shell/search-button";
import { buttonVariants } from "@/components/ui/button";

/**
 * Sticky 64px header. From `md`: the sidebar toggle on the left, Search
 * centered, New alert on the right. Below `md`: the menu button and logo on
 * the left, then the Search icon and an icon-only New alert on the right.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2.5 border-b border-[#e1e7e3] bg-white/92 px-[clamp(16px,2.4vw,32px)] backdrop-blur-md md:grid md:grid-cols-[1fr_auto_1fr] dark:border-border dark:bg-card/92">
      <div className="flex min-w-0 items-center gap-2.5">
        <SidebarToggleButton />
        <HeaderMenuButton />
        <span className="flex min-w-0 items-center gap-2 font-heading font-bold text-[#183323] md:hidden dark:text-foreground">
          <AppLogo variant="brand" size="sm" />
          MI-ISI
        </span>
      </div>
      <div className="ml-auto md:ml-0">
        <SearchButton />
      </div>
      <div className="flex justify-end">
        <Link
          href="/alerts/new"
          className={buttonVariants({ className: "size-11 gap-2 px-0 text-[13px] sm:h-10 sm:w-auto sm:px-4" })}
        >
          <Plus aria-hidden="true" />
          <span className="max-sm:sr-only">New alert</span>
        </Link>
      </div>
    </header>
  );
}
