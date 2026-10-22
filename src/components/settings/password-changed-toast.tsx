"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Shows the "password changed" toast after `changePassword` redirects here
 * with `?passwordChanged=1`, then drops the flag from the URL so a reload
 * doesn't show it again. Uses `useSearchParams`, so render it inside `<Suspense>`.
 */
export function PasswordChangedToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const changed = searchParams.get("passwordChanged") === "1";

  useEffect(() => {
    if (!changed) return;
    // A fixed id keeps Strict Mode's double effect from stacking two toasts.
    toast.success("Password changed. Other devices have been signed out.", {
      id: "password-changed",
    });
    // router.replace() here is dropped when this mounts at the end of the
    // Server Action's redirect; the native call syncs with the router instead.
    window.history.replaceState(null, "", pathname);
  }, [changed, pathname]);

  return null;
}
