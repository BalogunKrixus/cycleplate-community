/* Values that product decisions hang on, kept in one place so changing one is
   a one line edit rather than a search across components. */

export const POST_MAX_LENGTH = 2000;
export const REPLY_MAX_LENGTH = 2000;
export const FEED_PAGE_SIZE = 20;

export const ADMIN_BADGE_LABEL = "CyclePlate Team";

/* The guidelines banner. The professional wording stays generic rather than
   naming one role, so it does not go stale as the panel of professionals
   changes. */
export const GUIDELINES_TEXT =
  "Be kind. No diagnoses, no shame, no selling. A real professional answers flagged questions within 48 hours.";

export const GUIDELINES_DISMISS_KEY = "cp_guidelines_dismissed";

export const PROFESSIONAL_CATEGORIES = [
  { value: "nutritionist", label: "Nutritionist" },
  { value: "dietitian", label: "Dietitian" },
  { value: "doctor", label: "Doctor" },
  { value: "gynecologist", label: "Gynecologist" },
  { value: "other", label: "Other" },
] as const;

/* Phase palette from the brand guide. Categories borrow these so a chip and its
   posts read as one colour family. */
export const PHASE_COLORS = {
  menstrual: "#B23A4B",
  follicular: "#7C9A65",
  ovulatory: "#E0A33E",
  luteal: "#96617F",
} as const;

const CATEGORY_COLOR_ORDER = [
  PHASE_COLORS.menstrual,
  PHASE_COLORS.follicular,
  PHASE_COLORS.ovulatory,
  PHASE_COLORS.luteal,
];

/* Categories are editable in the panel, so a colour cannot be hardcoded per
   slug. Deriving it from the slug keeps a category the same colour for good,
   without a lookup table to maintain. */
export function categoryColor(slug: string | null | undefined): string {
  if (!slug) return PHASE_COLORS.luteal;
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_COLOR_ORDER[hash % CATEGORY_COLOR_ORDER.length];
}
