import type { ReactNode } from "react";
import { avatarColor, initialOf } from "@/lib/displayName";
import { ADMIN_BADGE_LABEL, categoryColor } from "@/lib/config";
import type { ProfessionalCategory, UserRole } from "@/lib/types";
import { PROFESSIONAL_CATEGORIES } from "@/lib/config";

export function Avatar({
  displayName,
  size = 40,
}: {
  displayName: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{
        width: size,
        height: size,
        background: avatarColor(displayName),
        fontSize: Math.round(size * 0.4),
      }}
    >
      {initialOf(displayName)}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-card bg-surface shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function CategoryChip({ slug, label }: { slug: string; label: string }) {
  const color = categoryColor(slug);
  return (
    <span
      className="inline-flex items-center rounded-chip px-3 py-1 text-[12px] font-medium"
      style={{ color, background: `${color}1A` }}
    >
      {label}
    </span>
  );
}

function professionalLabel(
  category: ProfessionalCategory | null,
  other: string | null,
): string {
  if (category === "other") return other?.trim() || "Professional";
  const found = PROFESSIONAL_CATEGORIES.find((c) => c.value === category);
  return found ? found.label : "Professional";
}

/* The badge that tells a reader whether an answer carries any weight. Kept in
   one place so a professional reply can never accidentally render as a team
   reply, or the other way round. */
export function AuthorBadge({
  role,
  category,
  categoryOther,
}: {
  role: UserRole;
  category?: ProfessionalCategory | null;
  categoryOther?: string | null;
}) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center rounded-chip bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cream">
        {ADMIN_BADGE_LABEL}
      </span>
    );
  }

  if (role === "professional") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-chip bg-expert px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
        Expert answered
        <span className="font-normal normal-case opacity-90">
          {professionalLabel(category ?? null, categoryOther ?? null)}
        </span>
      </span>
    );
  }

  return null;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "quiet" | "ghost";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-ink text-cream hover:shadow-lift",
    quiet: "bg-cream text-ink shadow-chip hover:shadow-card",
    ghost: "text-muted hover:text-ink",
  }[variant];

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-chip px-5 py-2.5 text-[15px] font-medium
                  transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
