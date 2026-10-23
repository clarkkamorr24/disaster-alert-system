import { FlaskConical } from "lucide-react";

import { isTestMode } from "@/lib/sms";

/** Amber bar shown above every app page while `SMS_DRIVER=fake`; renders nothing otherwise. */
export function TestModeBanner() {
  if (!isTestMode()) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-status-advisory-border bg-status-advisory-soft px-4 py-2 text-[13px] font-semibold text-status-advisory"
    >
      <FlaskConical className="size-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
      <span>TEST MODE: messages are not really sent</span>
    </div>
  );
}
