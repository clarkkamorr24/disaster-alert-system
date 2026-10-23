"use client";

import { Send } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { toast } from "sonner";

import { sendBroadcastAction } from "@/actions/broadcasts";
import { ZonePicker } from "@/components/alerts/zone-picker";
import { ConfirmSendDialog } from "@/components/broadcast/confirm-dialog";
import { ComposePreview } from "@/components/broadcast/compose-preview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  findUnfilledPlaceholders,
  NO_BROADCAST_ZONES_MESSAGE,
  NO_MEMBERS_MESSAGE,
  NOT_ENOUGH_CREDITS_MESSAGE,
  renderComposeMessage,
  unfilledPlaceholderMessage,
} from "@/lib/broadcast/compose";
import { estimateCredits, sanitizeSmsText, validateSmsContent, withPrefix } from "@/lib/domain/sms-text";
import { isRedirectError } from "@/lib/redirect-error";
import type { ActionResult } from "@/types/action-result";
import type { ComposeAlert, ComposeTemplate, ComposeZone, SendBroadcastActionInput } from "@/types/broadcast";

interface ComposeFormProps {
  /** The SMS prefix every message starts with, such as `Mi-isi FA:`. */
  prefix: string;
  /** Whether links are blocked (the default sender ID can't send them). */
  blockLinks: boolean;
  /** `null` when the balance couldn't be read. */
  balance: number | null;
  zones: ComposeZone[];
  templates: ComposeTemplate[];
  /** The alert the broadcast is about, or `null` for a general announcement. */
  alert: ComposeAlert | null;
  initialTemplateId: string | null;
  initialMessage: string;
}

type SendResult = ActionResult<{ broadcastId: string }>;

/** The problems that keep a message from being sent, in the order the officer should fix them. */
function messageErrors(body: string, text: string, blockLinks: boolean): string[] {
  if (body === "") return [];
  const unfilled = findUnfilledPlaceholders(body);
  const validation = validateSmsContent(text, { blockLinks });
  return [
    ...(unfilled.length > 0 ? [unfilledPlaceholderMessage(unfilled)] : []),
    ...(validation.ok ? [] : validation.errors),
  ];
}

export function ComposeForm({
  prefix,
  blockLinks,
  balance,
  zones,
  templates,
  alert,
  initialTemplateId,
  initialMessage,
}: ComposeFormProps) {
  // One key per compose form, so a double click or a retry creates one broadcast.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [message, setMessage] = useState(initialMessage);
  const [zoneIds, setZoneIds] = useState(alert?.zoneIds ?? []);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
  const errors = messageErrors(body, text, blockLinks);
  const creditsPerMember = estimateCredits(text);
  const selectedZones = zones.filter((zone) => zoneIds.includes(zone.id));
  const memberCount = selectedZones.reduce((sum, zone) => sum + zone.activeMemberCount, 0);
  const totalCredits = creditsPerMember * memberCount;
  const overBalance = balance !== null && totalCredits > balance;
  const canSend = body !== "" && errors.length === 0 && memberCount > 0 && !overBalance && !pending;

  // Choosing no zone yet is a hint; zones with nobody to send to are an error.
  const recipientProblem = zoneIds.length > 0 && memberCount === 0 ? NO_MEMBERS_MESSAGE : null;
  const recipientHint =
    zoneIds.length === 0 ? NO_BROADCAST_ZONES_MESSAGE : "Only active members receive the message.";
  const serverError = state && !state.success ? state.error : null;

  function chooseTemplate(id: string | null) {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) setMessage(renderComposeMessage(template.body, alert, new Date()));
  }

  function handleConfirm() {
    startTransition(() => formAction({ idempotencyKey, content: message, alertId: alert?.id ?? null, zoneIds }));
  }

  return (
    <div className="flex flex-col gap-5">
      {templates.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="compose-template">Template</Label>
          <Select
            items={templates.map((t) => ({ value: t.id, label: t.name }))}
            value={templateId}
            onValueChange={(value) => chooseTemplate(value as string | null)}
          >
            <SelectTrigger id="compose-template" className="w-full text-base data-[size=default]:h-11">
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id} className="min-h-11 text-base">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Choosing a template replaces the message.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="compose-message">Message</Label>
        <Textarea
          id="compose-message"
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={errors.length > 0 ? true : undefined}
          aria-describedby={errors.length > 0 ? "compose-message-errors" : undefined}
        />
        {errors.length > 0 && (
          <ul id="compose-message-errors" className="flex flex-col gap-1 text-sm text-destructive">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
        <p className="text-sm text-muted-foreground">&ldquo;{prefix}&rdquo; is added to the start of every message.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span id="compose-zones-label" className="text-sm leading-none font-medium">
          Send to
        </span>
        <ZonePicker
          zones={zones}
          selected={zoneIds}
          onChange={setZoneIds}
          labelId="compose-zones-label"
          errorId={recipientProblem ? "compose-zones-error" : undefined}
          hints={Object.fromEntries(
            zones.map((zone) => [
              zone.id,
              `${zone.activeMemberCount} ${zone.activeMemberCount === 1 ? "member" : "members"}`,
            ]),
          )}
        />
        {recipientProblem ? (
          <p id="compose-zones-error" className="text-sm text-destructive">
            {recipientProblem}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{recipientHint}</p>
        )}
      </div>

      <ComposePreview text={text} creditsPerMember={creditsPerMember} memberCount={memberCount} balance={balance} />

      {overBalance && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {NOT_ENOUGH_CREDITS_MESSAGE}
        </p>
      )}
      {serverError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {serverError}
        </p>
      )}

      <Button
        type="button"
        disabled={!canSend}
        onClick={() => setConfirmOpen(true)}
        className="h-11 self-start px-5 text-base"
      >
        <Send data-icon="inline-start" />
        {pending ? "Sending…" : "Send SMS"}
      </Button>

      <ConfirmSendDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        memberCount={memberCount}
        zoneNames={selectedZones.map((zone) => zone.name)}
        totalCredits={totalCredits}
        pending={pending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
