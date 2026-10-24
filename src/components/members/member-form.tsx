"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { toast } from "sonner";

import { createMember, updateMember } from "@/actions/members";
import { PhoneInput } from "@/components/members/phone-input";
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
  /** `compact` (the Add member pop-up) leaves out Notes and puts Cancel and Save on the right. */
  layout?: "page" | "compact";
  /**
   * Set by the pop-up: the new member is saved without leaving the page, then
   * this is called. Without it, a successful add redirects to `/members`.
   */
  onCreated?: () => void;
  /** Shows a Cancel button that calls this. */
  onCancel?: () => void;
}

type SubmitResult = ActionResult<{ id: string } | void>;

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
    // The +63 box shows the country code, so the input drops the leading 0.
    phone: member ? formatPhoneForDisplay(member.phone).replace(/^0/, "") : "",
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

/** Input props that link a field to its error message, plus an optional helper text. */
function describedBy(errorId: string, message: string | undefined, helperId?: string) {
  const ids = [message ? errorId : undefined, helperId].filter(Boolean).join(" ");
  return {
    ...(message ? { "aria-invalid": true } : {}),
    ...(ids ? { "aria-describedby": ids } : {}),
  };
}

export function MemberForm({
  zones,
  member,
  layout = "page",
  onCreated,
  onCancel,
}: MemberFormProps) {
  async function submit(prev: SubmitResult | null, formData: FormData): Promise<SubmitResult> {
    let result: SubmitResult;
    try {
      result = member
        ? await updateMember(member.id, null, formData)
        : await createMember(prev, formData);
    } catch (error) {
      // A successful create redirects to /members; let Next.js finish the navigation.
      if (isRedirectError(error)) toast.success("Member added.");
      throw error;
    }
    if (!result.success) {
      toast.error(result.error);
    } else if (member) {
      toast.success("Member saved.");
    } else {
      toast.success("Member added.");
      onCreated?.();
    }
    return result;
  }

  const [state, formAction, pending] = useActionState(submit, null);
  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const values = initialValues(member);
  const error = (field: string) => fieldErrors?.[field]?.[0];
  const compact = layout === "compact";

  // Submitting through onSubmit skips React's automatic form reset, which
  // would desync the hidden inputs of the Base UI Select and Checkbox from
  // what they show. Every field keeps what was typed after a rejected save.
  // The form's method is POST so a submit before hydration never puts member
  // details in the URL.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (onCreated) formData.set("stay", "1");
    startTransition(() => formAction(formData));
  }

  const zoneItems = zones.map((zone) => ({ value: zone.id, label: zone.name }));

  return (
    <form method="post" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 min-[400px]:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-first-name">First name</Label>
          <Input
            id="member-first-name"
            name="firstName"
            required
            maxLength={60}
            autoComplete="off"
            defaultValue={values.firstName}
            {...describedBy("member-first-name-error", error("firstName"))}
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
            {...describedBy("member-last-name-error", error("lastName"))}
            className="h-11"
          />
          <FieldError id="member-last-name-error" message={error("lastName")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="member-phone">Mobile number</Label>
        <PhoneInput
          id="member-phone"
          name="phone"
          required
          defaultValue={values.phone}
          {...describedBy("member-phone-error", error("phone"), "member-phone-help")}
        />
        <p id="member-phone-help" className="text-xs text-muted-foreground">
          Saved in +63 format. 09xx numbers are converted automatically.
        </p>
        <FieldError id="member-phone-error" message={error("phone")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="member-zone">Home zone</Label>
        <Select name="zoneId" items={zoneItems} defaultValue={values.zoneId || null}>
          <SelectTrigger
            id="member-zone"
            {...describedBy("member-zone-error", error("zoneId"))}
            className="h-11 w-full text-base data-[size=default]:h-11"
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
          {...describedBy("member-crops-error", error("crops"))}
          className="h-11"
        />
        <FieldError id="member-crops-error" message={error("crops")} />
      </div>

      {!compact && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="member-notes">Notes (optional)</Label>
          <Textarea
            id="member-notes"
            name="notes"
            maxLength={500}
            defaultValue={values.notes}
            {...describedBy("member-notes-error", error("notes"))}
          />
          <FieldError id="member-notes-error" message={error("notes")} />
        </div>
      )}

      {/* Consent is recorded once, on add; the detail header shows when. */}
      {!member && (
        <div className="flex flex-col gap-2">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
            <Checkbox
              name="consent"
              {...describedBy("member-consent-error", error("consent"))}
              className="mt-0.5 size-5"
            />
            <span className="text-sm">
              The member agreed to receive SMS alerts and to have their details stored (RA 10173).
            </span>
          </label>
          <FieldError id="member-consent-error" message={error("consent")} />
        </div>
      )}

      <div className={compact ? "mt-1 flex justify-end gap-2" : "flex gap-2"}>
        {onCancel && (
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel} className="h-11 px-4 text-[13px]">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending} className="h-11 px-5 text-[13px]">
          {pending ? "Saving…" : member || compact ? "Save member" : "Add member"}
        </Button>
      </div>
    </form>
  );
}
