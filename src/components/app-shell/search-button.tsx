"use client";

import { Search } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { HEADER_ICON_BUTTON } from "@/components/app-shell/header-styles";
import { SearchDialog } from "@/components/app-shell/search-dialog";
import { shortcutLabel } from "@/lib/shortcut";

function subscribe() {
  return () => {};
}

/** The header's Search box (from `md`) or icon button (below), plus the ⌘K / Ctrl K shortcut. */
export function SearchButton() {
  const [open, setOpen] = useState(false);
  // The platform is only known in the browser; the server renders the Windows label.
  const shortcut = useSyncExternalStore(
    subscribe,
    () => shortcutLabel(navigator.platform),
    () => "Ctrl K",
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-keyshortcuts="Meta+K Control+K"
        className="hidden h-10 w-[clamp(240px,30vw,400px)] items-center gap-[9px] rounded-[9px] border border-border bg-[#f8faf8] px-[11px] text-left text-[13px] text-[#718077] outline-none transition-colors hover:border-accent-border focus-visible:ring-3 focus-visible:ring-ring/25 md:flex dark:bg-muted dark:text-muted-foreground"
      >
        <Search className="size-[18px] shrink-0" aria-hidden="true" strokeWidth={1.75} />
        <span className="flex-1">Search</span>
        <kbd className="rounded-[5px] border border-[#d9e0db] bg-card px-1.5 py-0.5 font-sans text-[10px] text-[#839087] dark:border-border dark:text-muted-foreground">
          {shortcut}
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className={`${HEADER_ICON_BUTTON} md:hidden`}
      >
        <Search aria-hidden="true" strokeWidth={1.75} />
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
