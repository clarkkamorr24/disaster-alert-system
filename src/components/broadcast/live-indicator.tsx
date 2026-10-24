"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "cn";

/** How often the report re-reads the database while messages are pending. */
const REFRESH_MS = 10_000;

/**
 * "Live · updating" with a pulsing dot while any recipient is pending or
 * retrying, otherwise "Up to date". While live, it re-renders the page from
 * the database every 10 s (webhooks write the statuses; UniSMS itself isn't
 * polled). It pauses while the tab is hidden and stops once nothing is
 * pending or the page is left.
 */
export function LiveIndicator({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      if (timer === null) timer = setInterval(() => router.refresh(), REFRESH_MS);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stop();
        return;
      }
      // Catch up on what changed while the tab was hidden.
      router.refresh();
      start();
    };

    if (document.visibilityState !== "hidden") start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active, router]);

  return (
    <span className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-muted-foreground" aria-live="polite">
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", active ? "animate-pulse bg-live" : "bg-status-neutral")}
      />
      {active ? "Live · updating" : "Up to date"}
    </span>
  );
}
