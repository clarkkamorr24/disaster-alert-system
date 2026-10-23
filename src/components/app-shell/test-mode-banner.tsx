import { FlaskConical } from "lucide-react";

import { isTestMode } from "@/lib/sms";

/** Amber bar shown above every app page while `SMS_DRIVER=fake`; renders nothing otherwise. */
export function TestModeBanner() {
  if (!isTestMode()) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      <FlaskConical className="size-4 shrink-0" aria-hidden="true" />
      <span>TEST MODE: messages are not really sent</span>
    </div>
  );
}
