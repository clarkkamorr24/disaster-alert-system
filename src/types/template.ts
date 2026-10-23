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
