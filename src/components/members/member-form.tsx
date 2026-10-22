"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { toast } from "sonner";

import { createMember, updateMember } from "@/actions/members";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPhoneForDisplay } from "@/lib/domain/phone";
import { isRedirectError } from "@/lib/redirect-error";
import type { ActionResult } from "@/types/action-result";
import type { MemberFormValues, ZoneOption } from "@/types/member";

interface MemberFormProps {
  /** Zones to choose from; at least one. */
  zones: ZoneOption[];
  /** The member to edit; omit to add a new one. */
  member?: MemberFormValues;
  /** When consent was recorded, already formatted; shown on edit instead of the checkbox. */
  consentRecordedOn?: string;
}

interface FieldValues {
  firstName: string;
  lastName: string;
  phone: string;
  zoneId: string;
  crops: string;
  notes: string;
}

function initialValues(member: MemberFormValues | undefined): FieldValues {
  return {
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    phone: member ? formatPhoneForDisplay(member.phone) : "",
    zoneId: member?.zoneId ?? "",
    crops: member?.crops ?? "",
    notes: member?.notes ?? "",
  };
}

interface FieldErrorProps {
  id: string;
  message: string | undefined;
}

function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

/** Input props that link a field to its error message. */
function errorProps(id: string, message: string | undefined) {
  return message ? { "aria-invalid": true, "aria-describedby": id } : {};
}

export function MemberForm({ zones, member, consentRecordedOn }: MemberFormProps) {
  async function submit(prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
    let result: ActionResult;
    try {
      result = member
        ? await updateMember(member.id, prev, formData)
        : await createMember(prev, formData);
    } catch (error) {
      // A successful create redirects to /members; let Next.js finish the navigation.
      if (isRedirectError(error)) toast.success("Member added.");
      throw error;
    }
    if (result.success) toast.success("Member saved.");
    else toast.error(result.error);
    return result;
  }

  const [state, formAction, pending] = useActionState(submit, null);
  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const values = initialValues(member);
  const error = (field: string) => fieldErrors?.[field]?.[0];

  // Submitting through onSubmit skips React's automatic form reset, which
  // would desync the hidden inputs of the Base UI Select and Checkbox from
  // what they show. Every field keeps what was typed after a rejected save.
  // The form's method is POST so a submit before hydration never puts member
  // details in the URL.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const zoneItems = zones.map((zone) => ({ value: zone.id, label: zone.name }));

  return (
    <form method="post" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-first-name">First name</Label>
          <Input
            id="member-first-name"
            name="firstName"
            required
            maxLength={60}
            autoComplete="off"
            defaultValue={values.firstName}
            {...errorProps("member-first-name-error", error("firstName"))}
            className="h-11"
          />
          <FieldError id="member-first-name-error" message={error("firstName")} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="member-last-name">Last name</Label>
          <Input
            id="member-last-name"
            name="lastName"
            required
            maxLength={60}
            autoComplete="off"
            defaultValue={values.lastName}
            {...errorProps("member-last-name-error", error("lastName"))}
            className="h-11"
          />
          <FieldError id="member-last-name-error" message={error("lastName")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="member-phone">Mobile number</Label>
        <Input
          id="member-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          required
          autoComplete="off"
          placeholder="0917 123 4567"
          defaultValue={values.phone}
          {...errorProps("member-phone-error", error("phone"))}
          className="h-11"
        />
        <FieldError id="member-phone-error" message={error("phone")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="member-zone">Zone</Label>
        <Select name="zoneId" items={zoneItems} defaultValue={values.zoneId || null}>
          <SelectTrigger
            id="member-zone"
            {...errorProps("member-zone-error", error("zoneId"))}
            className="h-11 w-full text-base"
          >
            <SelectValue placeholder="Choose a zone" />
          </SelectTrigger>
          <SelectContent>
            {zoneItems.map((item) => (
              <SelectItem key={item.value} value={item.value} className="min-h-11 text-base">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError id="member-zone-error" message={error("zoneId")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="member-crops">Crops (optional)</Label>
        <Input
          id="member-crops"
          name="crops"
          maxLength={100}
          placeholder="Rice, corn"
          defaultValue={values.crops}
          {...errorProps("member-crops-error", error("crops"))}
          className="h-11"
        />
        <FieldError id="member-crops-error" message={error("crops")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="member-notes">Notes (optional)</Label>
        <Textarea
          id="member-notes"
          name="notes"
          maxLength={500}
          defaultValue={values.notes}
          {...errorProps("member-notes-error", error("notes"))}
        />
        <FieldError id="member-notes-error" message={error("notes")} />
      </div>

      {member ? (
        <p className="text-sm text-muted-foreground">Consent recorded on {consentRecordedOn}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
            <Checkbox
              name="consent"
              {...errorProps("member-consent-error", error("consent"))}
              className="mt-0.5 size-5"
            />
            <span className="text-sm">
              The member agreed to receive SMS alerts and to have their details stored (RA 10173).
            </span>
          </label>
          <FieldError id="member-consent-error" message={error("consent")} />
        </div>
      )}

      <Button type="submit" disabled={pending} className="h-11 self-start px-5 text-base">
        {pending ? "Saving…" : member ? "Save member" : "Add member"}
      </Button>
    </form>
  );
}
