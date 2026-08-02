/* Anonymous handles.

   Generated rather than chosen, so nobody puts their real name on a post about
   endometriosis by accident. A member may change it once from account settings,
   which is enough to feel like theirs without letting a name be churned to
   shake off a reputation. */

const FIRST = [
  "Quiet", "Bright", "Gentle", "Steady", "Golden", "Soft", "Warm", "Calm",
  "Kind", "Still", "Sunlit", "Wild", "Rooted", "Open", "Clear", "Easy",
  "Honest", "Patient", "Certain", "Amber", "Olive", "Hazel", "Ivy", "Wren",
];

const SECOND = [
  "Fern", "River", "Willow", "Meadow", "Harbour", "Orchard", "Garden", "Field",
  "Sparrow", "Linnet", "Heather", "Juniper", "Cedar", "Poppy", "Clover",
  "Bramble", "Thistle", "Aster", "Sorrel", "Laurel", "Maple", "Rowan",
];

/* Two words plus two digits. Roughly 264,000 combinations before the digits,
   which is ample for a community of this size, and the database has a unique
   index on the name so a collision is caught rather than assumed away. */
export function generateDisplayName(): string {
  const first = FIRST[Math.floor(Math.random() * FIRST.length)];
  const second = SECOND[Math.floor(Math.random() * SECOND.length)];
  const digits = String(Math.floor(Math.random() * 90) + 10);
  return `${first}${second} ${digits}`;
}

export function initialOf(displayName: string): string {
  return displayName.trim().charAt(0).toUpperCase() || "C";
}

/* A stable colour per handle, so the same person keeps the same avatar down a
   thread. Derived from the name rather than stored, because it is decoration. */
const AVATAR_COLORS = ["#B23A4B", "#7C9A65", "#E0A33E", "#96617F"];

export function avatarColor(displayName: string): string {
  let hash = 0;
  for (let i = 0; i < displayName.length; i += 1) {
    hash = (hash * 31 + displayName.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const NAME_PATTERN = /^[A-Za-z0-9 ]{3,24}$/;

/* Deliberately narrow. No punctuation means no lookalike impersonation of the
   team badge, and no email addresses or handles smuggled into a name. */
export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (!NAME_PATTERN.test(trimmed)) {
    return "Use 3 to 24 letters, numbers or spaces.";
  }
  if (/cycleplate|admin|moderator|official|expert/i.test(trimmed)) {
    return "That name is reserved.";
  }
  return null;
}
