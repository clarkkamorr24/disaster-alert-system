"use client";

import { startTransition, useActionState, useState } from "react";
import { toast } from "sonner";

import { createAlertAndSend } from "@/actions/alerts";
import { HazardTilePicker } from "@/components/alerts/hazard-tile-picker";
import { FieldSection, LoggedAlertNote, TextField, TitleLevelFields } from "@/components/alerts/new-alert-fields";
import { SeverityPicker } from "@/components/alerts/severity-picker";
import { ZoneChipPicker, ZoneSelectAllButton } from "@/components/alerts/zone-chip-picker";
import { ConfirmSendDialog } from "@/components/broadcast/confirm-send-dialog";
import { SendSummaryCard } from "@/components/broadcast/send-summary-card";
import { Button } from "@/components/ui/button";
import { type AlertDraft, useAlertDraft } from "@/hooks/use-alert-draft";
import { NO_MEMBERS_MESSAGE, NOT_ENOUGH_CREDITS_MESSAGE } from "@/lib/broadcast/compose";
import { HAZARD_TYPES, SEVERITIES } from "@/lib/domain/hazards";
import { zonesLabel } from "@/lib/domain/zones-label";
import { isRedirectError } from "@/lib/redirect-error";
import type { AlertSendFailure, AlertSendInput } from "@/types/alert";
import type { ComposeTemplate, ComposeZone } from "@/types/broadcast";

interface NewAlertComposerProps {
  /** One per visit, made on the server; use it as the composer's `key` too. */
  idempotencyKey: string;
  prefix: string;
  blockLinks: boolean;
  /** `null` when the balance couldn't be read. */
  balance: number | null;
  zones: ComposeZone[];
  templates: ComposeTemplate[];
}

/** Why Review and send can't be pressed yet, or `null`. */
function blockedReason(draft: AlertDraft, balance: number | null): string | null {
  if (!draft.hazardType || !draft.severity) return "Choose a hazard type and severity.";
  if (draft.zoneIds.length === 0) return "Select at least one affected zone.";
  if (draft.memberCount === 0) return NO_MEMBERS_MESSAGE;
  if (draft.body === "") return "Write the SMS message.";
  if (draft.messageErrors.length > 0) return "Fix the SMS message first.";
  if (balance !== null && draft.totalCredits > balance) return NOT_ENOUGH_CREDITS_MESSAGE;
  return null;
}

/**
 * The New alert form with its sticky Summary: the alert, its zones, and its
 * SMS. Review and send logs the alert and sends the SMS after a
 * confirmation; Log alert without SMS only logs it.
 */
export function NewAlertComposer({ idempotencyKey, prefix, blockLinks, balance, zones, templates }: NewAlertComposerProps) {
  const draft = useAlertDraft({ zones, templates, prefix, blockLinks });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  // Set once a send failed after logging. The alert's fields then lock, since a retry reuses the saved alert.
  const [loggedAlertId, setLoggedAlertId] = useState<string | null>(null);
  const locked = loggedAlertId !== null;

  async function submit(_prev: AlertSendFailure | null, input: AlertSendInput): Promise<AlertSendFailure | null> {
    let result: AlertSendFailure;
    try {
      result = await createAlertAndSend(input);
    } catch (error) {
      // Success redirects to the report or the alert; let Next.js finish the navigation.
      if (isRedirectError(error)) toast.success(input.send ? "Alert logged and SMS sent." : "Alert logged.");
      throw error;
    }
    toast.error(result.error);
    if (result.alertId) setLoggedAlertId(result.alertId);
    setConfirmOpen(false);
    return result;
  }

  const [state, formAction, pending] = useActionState(submit, null);
  const error = (field: string) => state?.fieldErrors?.[field]?.[0];
  const errorId = (field: string) => (error(field) ? `alert-${field}-error` : undefined);
  const reason = blockedReason(draft, balance);
  const alertLabel =
    draft.hazardType && draft.severity
      ? `${HAZARD_TYPES[draft.hazardType].label} · ${SEVERITIES[draft.severity].label}`
      : "—";

  function save(send: boolean) {
    const input: AlertSendInput = {
      idempotencyKey,
      title: draft.title,
      hazardType: draft.hazardType,
      severity: draft.severity,
      officialLevel: draft.officialLevel,
      description: draft.description,
      zoneIds: draft.zoneIds,
      send,
      content: draft.message,
      templateId: draft.templateId,
    };
    startTransition(() => formAction(input));
  }

  function openConfirm() {
    setConfirmChecked(false);
    setConfirmOpen(true);
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 flex-[3_1_440px] flex-col gap-6 rounded-xl border bg-card p-[22px]">
        <FieldSection labelId="alert-hazard-label" label="Hazard type" error={error("hazardType")} errorId={errorId("hazardType")}>
          <HazardTilePicker
            value={draft.hazardType}
            onChange={draft.setHazardType}
            labelledBy="alert-hazard-label"
            errorId={errorId("hazardType")}
            disabled={locked}
          />
        </FieldSection>

        <FieldSection labelId="alert-severity-label" label="Severity" error={error("severity")} errorId={errorId("severity")}>
          <SeverityPicker
            value={draft.severity}
            onChange={draft.setSeverity}
            labelledBy="alert-severity-label"
            errorId={errorId("severity")}
            disabled={locked}
          />
        </FieldSection>

        <FieldSection
          labelId="alert-zones-label"
          label="Affected farm zones"
          aside={
            <ZoneSelectAllButton zones={zones} selected={draft.zoneIds} onChange={draft.setZoneIds} disabled={locked} />
          }
          error={error("zoneIds")}
          errorId={errorId("zoneIds")}
        >
          <ZoneChipPicker
            zones={zones}
            selected={draft.zoneIds}
            onChange={draft.setZoneIds}
            labelledBy="alert-zones-label"
            errorId={errorId("zoneIds")}
            disabled={locked}
          />
        </FieldSection>

        <TitleLevelFields
          title={draft.title}
          onTitleChange={draft.setTitle}
          officialLevel={draft.officialLevel}
          onOfficialLevelChange={draft.setOfficialLevel}
          suggestions={draft.hazardType ? HAZARD_TYPES[draft.hazardType].levelSuggestions : []}
          errors={{ title: error("title"), officialLevel: error("officialLevel") }}
          disabled={locked}
        />

        <TextField
          id="alert-description"
          label="Recommended precautions"
          value={draft.description}
          onChange={draft.setDescription}
          error={error("description")}
          helper="Saved with the alert record."
          maxLength={2000}
          rows={3}
          disabled={locked}
        />

        <div className="flex flex-col gap-2">
          <TextField
            id="alert-message"
            label="SMS message"
            value={draft.message}
            onChange={draft.setMessage}
            error={draft.messageErrors.length > 0 ? draft.messageErrors.join(" ") : undefined}
            helper={`${draft.text.length} characters · ${draft.creditsPerMember} SMS ${draft.creditsPerMember === 1 ? "credit" : "credits"} per member`}
            placeholder="Choose a hazard type to start from its template."
            rows={5}
          />
          {draft.messageEdited && (
            <button type="button" onClick={draft.resetMessage} className="min-h-11 self-start text-xs font-bold text-link hover:text-primary-hover sm:min-h-0">
              Reset to template
            </button>
          )}
        </div>

        {loggedAlertId && <LoggedAlertNote alertId={loggedAlertId} />}
        {state && !state.fieldErrors && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {state.error}
          </p>
        )}
      </div>

      <SendSummaryCard
        memberCount={draft.memberCount}
        rows={[
          { label: "Alert", value: alertLabel },
          { label: "Zones", value: zonesLabel(draft.selectedZones.map((zone) => zone.name), zones.length) },
        ]}
        totalCredits={draft.totalCredits}
        balance={balance}
        prefix={prefix}
        text={draft.text}
        blockedReason={reason}
        pending={pending}
        onReview={openConfirm}
      >
        <Button type="button" variant="outline" disabled={pending} onClick={() => save(false)} className="h-11 text-[13px]">
          {pending ? "Saving…" : "Log alert without SMS"}
        </Button>
      </SendSummaryCard>

      <ConfirmSendDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        subject="alert"
        about={{ label: "Alert", value: alertLabel }}
        memberCount={draft.memberCount}
        totalCredits={draft.totalCredits}
        zones={draft.selectedZones.map((zone) => ({ name: zone.name, count: zone.activeMemberCount }))}
        checked={confirmChecked}
        onCheckedChange={setConfirmChecked}
        pending={pending}
        onConfirm={() => save(true)}
      />
    </div>
  );
}
