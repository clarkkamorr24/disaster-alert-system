"use client";

import { useActionState } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/types/action-result";

interface ProfileFormProps {
  name: string;
  email: string;
}

interface ProfileState {
  result: ActionResult;
  /** Echoed back so a rejected edit survives React's form reset. */
  name: string;
  email: string;
}

async function submit(prev: ProfileState | null, formData: FormData): Promise<ProfileState> {
  const result = await updateProfile(prev?.result ?? null, formData);
  if (result.success) toast.success("Profile saved.");
  else toast.error(result.error);
  return {
    result,
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
}

export function ProfileForm({ name, email }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(submit, null);
  const failed = state && !state.result.success ? state : null;
  const failure = failed && !failed.result.success ? failed.result : null;
  const nameError = failure?.fieldErrors?.name?.[0];
  const emailError = failure?.fieldErrors?.email?.[0];

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          name="name"
          autoComplete="name"
          required
          defaultValue={failed?.name ?? name}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "profile-name-error" : undefined}
          className="h-11"
        />
        {nameError && (
          <p id="profile-name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={failed?.email ?? email}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "profile-email-error" : undefined}
          className="h-11"
        />
        {emailError && (
          <p id="profile-email-error" className="text-sm text-destructive">
            {emailError}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="h-11 self-start px-5 text-base">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
