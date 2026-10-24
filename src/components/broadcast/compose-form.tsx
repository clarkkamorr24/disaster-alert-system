"use client";

import { startTransition, useActionState, useState } from "react";
import { toast } from "sonner";

import { sendBroadcastAction } from "@/actions/broadcasts";
import { FieldSection, TextField } from "@/components/alerts/new-alert-fields";
import { ZoneChipPicker, ZoneSelectAllButton } from "@/components/alerts/zone-chip-picker";
import { ResendRecipients, TemplateSelect } from "@/components/broadcast/compose-fields";
import { ConfirmSendDialog } from "@/components/broadcast/confirm-send-dialog";
import { SendSummaryCard } from "@/components/broadcast/send-summary-card";
import {
  composeMessageErrors,
  NO_BROADCAST_ZONES_MESSAGE,
  NO_MEMBERS_MESSAGE,
  NO_UNREACHED_MESSAGE,
  NOT_ENOUGH_CREDITS_MESSAGE,
  renderComposeMessage,
} from "@/lib/broadcast/compose";
import { estimateCredits, sanitizeSmsText, withPrefix } from "@/lib/domain/sms-text";
import { zonesLabel } from "@/lib/domain/zones-label";
import { isRedirectError } from "@/lib/redirect-error";
import type { ActionResult } from "@/types/action-result";
import type {
  ComposeAlert,
  ComposeResend,
  ComposeTemplate,
  ComposeZone,
  SendBroadcastActionInput,
} from "@/types/broadcast";

interface ComposeFormProps {
  /**
   * One per compose form, so a double click or a retry creates one broadcast.
   * Made on the server for each visit; use it as the form's `key` too.
   */
  idempotencyKey: string;
  /** The SMS prefix every message starts with, such as `Mi-isi FA:`. */
  prefix: string;
  /** Shown as the sender in the SMS preview. */
  senderId: string;
  /** Whether links are blocked (the default sender ID can't send them). */
  blockLinks: boolean;
  /** `null` when the balance couldn't be read. */
  balance: number | null;
  zones: ComposeZone[];
  templates: ComposeTemplate[];
  /** The alert the broadcast is about, or `null` for a general announcement. */
  alert: ComposeAlert | null;
  /** For a resend, the unreached members it goes to; the zone picker is hidden. */
  resend: ComposeResend | null;
  initialTemplateId: string | null;
  initialMessage: string;
}

type SendResult = ActionResult<{ broadcastId: string }>;

/** Why Review and send can't be pressed yet, or `null`. */
function blockedReason(args: {
  resend: boolean;
  zoneCount: number;
  memberCount: number;
  body: string;
  errorCount: number;
  overBalance: boolean;
}): string | null {
  if (!args.resend && args.zoneCount === 0) return NO_BROADCAST_ZONES_MESSAGE;
  if (args.memberCount === 0) return args.resend ? NO_UNREACHED_MESSAGE : NO_MEMBERS_MESSAGE;
  if (args.body === "") return "Write the SMS message.";
  if (args.errorCount > 0) return "Fix the SMS message first.";
  if (args.overBalance) return NOT_ENOUGH_CREDITS_MESSAGE;
  return null;
}

/** The broadcast composer with its sticky Summary: template, message, and zones (or the resend's members). */
export function ComposeForm(props: ComposeFormProps) {
  const { idempotencyKey, prefix, senderId, blockLinks, balance, zones, templates, alert, resend } = props;
  const [templateId, setTemplateId] = useState(props.initialTemplateId);
  const [message, setMessage] = useState(props.initialMessage);
  const [zoneIds, setZoneIds] = useState(resend ? [] : (alert?.zoneIds ?? []));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  async function submit(_prev: SendResult | null, input: SendBroadcastActionInput): Promise<SendResult> {
    let result: SendResult;
    try {
      result = await sendBroadcastAction(input);
    } catch (error) {
      // A send redirects to the broadcast report; let Next.js finish the navigation.
      if (isRedirectError(error)) toast.success("Broadcast sent.");
      throw error;
    }
    if (!result.success) {
      toast.error(result.error);
      setConfirmOpen(false);
    }
    return result;
  }

  const [state, formAction, pending] = useActionState(submit, null);

  const body = sanitizeSmsText(message);
  const text = body === "" ? "" : withPrefix(body, prefix);
  const errors = composeMessageErrors(body, text, blockLinks);
  const creditsPerMember = estimateCredits(text);
  const selectedZones = zones.filter((zone) => zoneIds.includes(zone.id));
  const memberCount = resend ? resend.memberCount : selectedZones.reduce((sum, z) => sum + z.activeMemberCount, 0);
  const totalCredits = creditsPerMember * memberCount;
  const overBalance = balance !== null && totalCredits > balance;
  const reason = blockedReason({
    resend: resend !== null,
    zoneCount: zoneIds.length,
    memberCount,
    body,
    errorCount: errors.length,
    overBalance,
  });
  const zoneNames = resend ? resend.zoneNames : selectedZones.map((zone) => zone.name);
  const about = alert?.title ?? "Announcement";
  // Choosing no zone yet is a hint in the Summary; zones with nobody to send to are an error here.
  const zoneError = !resend && zoneIds.length > 0 && memberCount === 0 ? NO_MEMBERS_MESSAGE : undefined;

  function chooseTemplate(id: string | null) {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) setMessage(renderComposeMessage(template.body, alert, new Date()));
  }

  function handleConfirm() {
    const target = resend ? { retryOfId: resend.retryOfId } : { alertId: alert?.id ?? null, zoneIds };
    startTransition(() => formAction({ idempotencyKey, content: message, templateId, ...target }));
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 flex-[3_1_440px] flex-col gap-6 rounded-xl border bg-card p-[22px]">
        {templates.length > 0 && <TemplateSelect templates={templates} value={templateId} onChange={chooseTemplate} />}

        <TextField
          id="compose-message"
          label="SMS message"
          value={message}
          onChange={setMessage}
          error={errors.length > 0 ? errors.join(" ") : undefined}
          helper={`${text.length} characters · ${creditsPerMember} SMS ${creditsPerMember === 1 ? "credit" : "credits"} per member·`}
          rows={6}
        />

        {resend ? (
          <ResendRecipients resend={resend} />
        ) : (
          <FieldSection
            labelId="compose-zones-label"
            label="Send to"
            aside={<ZoneSelectAllButton zones={zones} selected={zoneIds} onChange={setZoneIds} />}
            error={zoneError}
            errorId={zoneError ? "compose-zones-error" : undefined}
          >
            <ZoneChipPicker
              zones={zones}
              selected={zoneIds}
              onChange={setZoneIds}
              labelledBy="compose-zones-label"
              errorId={zoneError ? "compose-zones-error" : undefined}
            />
            <p className="text-xs text-muted-foreground">Only active members receive the message.</p>
          </FieldSection>
        )}

        {state && !state.success && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {state.error}
          </p>
        )}
      </div>

      <SendSummaryCard
        memberCount={memberCount}
        rows={[
          { label: "About", value: about },
          { label: "Zones", value: zonesLabel(zoneNames, zones.length) },
        ]}
        totalCredits={totalCredits}
        balance={balance}
        senderId={senderId}
        text={text}
        blockedReason={reason}
        pending={pending}
        onReview={() => {
          setConfirmChecked(false);
          setConfirmOpen(true);
        }}
      />

      <ConfirmSendDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        subject={alert ? "alert" : "message"}
        about={{ label: "About", value: about }}
        memberCount={memberCount}
        totalCredits={totalCredits}
        zones={resend ? zoneNames.map((name) => ({ name })) : selectedZones.map((z) => ({ name: z.name, count: z.activeMemberCount }))}
        checked={confirmChecked}
        onCheckedChange={setConfirmChecked}
        pending={pending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
