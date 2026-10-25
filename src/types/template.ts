import type { HazardType } from "@/generated/prisma/enums";

/** The values {@link renderTemplate} fills into a template's placeholders. */
export interface TemplateVars {
  hazard: string;
  /** Official level, such as `Alert Level 3`; may be empty. */
  level: string;
  zones: string[];
  date: Date;
}

/** A saved template, as the edit form needs it. */
export interface TemplateFormValues {
  id: string;
  name: string;
  /** `null` when the template suits any hazard. */
  hazardType: HazardType | null;
  body: string;
}

export type TemplateView = "card" | "list";

/** A hazard filter value: one hazard type, or `ANY` for templates that suit any hazard. */
export type TemplateHazardFilter = HazardType | "ANY";

/** `used` = sent in at least one broadcast. */
export type TemplateUsageFilter = "used" | "unused";

/** The templates page's search, filters, and view, as read from the URL. */
export interface TemplateListFilters {
  q: string;
  /** `null` = every template. */
  hazard: TemplateHazardFilter | null;
  /** `null` = used or not. */
  usage: TemplateUsageFilter | null;
  view: TemplateView;
}
