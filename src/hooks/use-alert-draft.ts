"use client";

import { useState } from "react";

import type { HazardType, Severity } from "@/generated/prisma/enums";
import { useCurrentMinute } from "@/hooks/use-current-minute";
import { composeMessageErrors, pickDefaultTemplate, renderComposeMessage } from "@/lib/broadcast/compose";
import { HAZARD_TYPES } from "@/lib/domain/hazards";
import { estimateCredits, sanitizeSmsText, withPrefix } from "@/lib/domain/sms-text";
import type { ComposeTemplate, ComposeZone } from "@/types/broadcast";

interface DraftOptions {
  zones: ComposeZone[];
  templates: ComposeTemplate[];
  prefix: string;
  blockLinks: boolean;
}

/**
 * The New alert form's fields and what follows from them. The title and the
 * SMS follow the hazard, level, and zones until the officer types in them.
 */
export function useAlertDraft({ zones, templates, prefix, blockLinks }: DraftOptions) {
  const [hazardType, setHazardType] = useState<HazardType | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [officialLevel, setOfficialLevel] = useState("");
  const [description, setDescription] = useState("");
  // `null` until the officer types in the field.
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const now = useCurrentMinute();

  const hazard = hazardType ? HAZARD_TYPES[hazardType].label : null;
  const selectedZones = zones.filter((zone) => zoneIds.includes(zone.id));
  const template = hazardType ? pickDefaultTemplate(templates, { hazardType, status: "ACTIVE" }) : null;
  const templateMessage =
    template && hazard && now !== null
      ? renderComposeMessage(
          template.body,
          { hazard, level: officialLevel.trim(), zoneNames: selectedZones.map((zone) => zone.name) },
          new Date(now),
        )
      : "";
  const message = customMessage ?? templateMessage;

  const body = sanitizeSmsText(message);
  const text = body === "" ? "" : withPrefix(body, prefix);
  const creditsPerMember = estimateCredits(text);
  const memberCount = selectedZones.reduce((sum, zone) => sum + zone.activeMemberCount, 0);

  return {
    hazardType,
    setHazardType,
    severity,
    setSeverity,
    zoneIds,
    setZoneIds,
    officialLevel,
    setOfficialLevel,
    description,
    setDescription,
    title: customTitle ?? (hazard ? `${hazard} alert` : ""),
    setTitle: setCustomTitle,
    message,
    setMessage: setCustomMessage,
    messageEdited: customMessage !== null,
    resetMessage: () => setCustomMessage(null),
    hazard,
    selectedZones,
    body,
    text,
    messageErrors: composeMessageErrors(body, text, blockLinks),
    creditsPerMember,
    memberCount,
    totalCredits: creditsPerMember * memberCount,
  };
}

/** Everything {@link useAlertDraft} returns. */
export type AlertDraft = ReturnType<typeof useAlertDraft>;
