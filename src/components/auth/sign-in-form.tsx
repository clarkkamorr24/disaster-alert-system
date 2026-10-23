"use client";

import { useActionState } from "react";

import { signInAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/types/action-result";

interface SignInState {
  result: ActionResult;
  /** Echoed back so the email survives React's form reset after a failed attempt. */
  email: string;
}

async function submit(prev: SignInState | null, formData: FormData): Promise<SignInState> {
  const result = await signInAction(prev?.result ?? null, formData);
  return { result, email: String(formData.get("email") ?? "") };
}

export function SignInForm() {
  const [state, formAction, pending] = useActionState(submit, null);
  const failure = state && !state.result.success ? state.result : null;
  const emailError = failure?.fieldErrors?.email?.[0];
  const passwordError = failure?.fieldErrors?.password?.[0];

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className="h-[42px] px-3"
        />
        {emailError && (
          <p id="email-error" className="text-sm text-destructive">
            {emailError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : undefined}
          className="h-[42px] px-3"
        />
        {passwordError && (
          <p id="password-error" className="text-sm text-destructive">
            {passwordError}
          </p>
        )}
      </div>

      {failure && !failure.fieldErrors && (
        <p role="alert" className="text-sm text-destructive">
          {failure.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 w-full text-[13px]">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
