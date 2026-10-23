import { useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 10_000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
}

function getServerSnapshot() {
  return null;
}

/**
 * The current time, rounded down to the minute, as epoch milliseconds.
 *
 * Returns `null` on the server and during hydration, so server and client
 * render the same markup and prerendering never reads the clock.
 */
export function useCurrentMinute(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
