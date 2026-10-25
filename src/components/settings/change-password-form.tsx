"use client";

import { useActionState } from "react";
import { toast } from "sonner";

import { changePassword } from "@/actions/account";
import { PasswordInput } from "@/components/settings/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation/account";
import type { ActionResult } from "@/types/action-result";

const FIELDS = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  { name: "newPassword", label: "New password", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
] as const;

// Success redirects to /settings?passwordChanged=1, where PasswordChangedToast takes over.
async function submit(prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const result = await changePassword(prev, formData);
  if (!result.success) toast.error(result.error);
  return result;
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(submit, null);
  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {FIELDS.map((field) => {
        const id = `password-${field.name}`;
        const error = fieldErrors?.[field.name]?.[0];
        return (
          <div key={field.name} className="flex flex-col gap-2">
            <Label htmlFor={id}>{field.label}</Label>
            <PasswordInput
              id={id}
              name={field.name}
              autoComplete={field.autoComplete}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              className="h-11"
            />
            {field.name === "newPassword" && !error && (
              <p className="text-sm text-muted-foreground">
                At least {PASSWORD_MIN_LENGTH} characters.
              </p>
            )}
            {error && (
              <p id={`${id}-error`} className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        );
      })}

      <p className="text-sm text-muted-foreground">
        Changing the password signs out every other device. This one stays signed in.
      </p>

      <Button type="submit" disabled={pending} className="h-11 self-start px-5 text-base">
        {pending ? "Changing…" : "Change password"}
      </Button>
    </form>
  );
}
