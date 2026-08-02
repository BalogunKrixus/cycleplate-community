"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GUIDELINES_DISMISS_KEY, GUIDELINES_TEXT } from "@/lib/config";
import type { Category } from "@/lib/types";

/* Dismissed per browser session rather than for good. The rules matter most to
   someone arriving fresh, and sessionStorage clears itself. */
export function GuidelinesBanner() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(sessionStorage.getItem(GUIDELINES_DISMISS_KEY) === "1");
  }, []);

  if (hidden) return null;

  return (
    <div className="flex items-start gap-3 rounded-card bg-follicular/12 p-4 shadow-chip">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#7C9A65"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="mt-0.5 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v.1M12 11.5v5" />
      </svg>
      <p className="flex-1 text-[14px] leading-relaxed text-ink">
        {GUIDELINES_TEXT}
      </p>
      <button
        type="button"
        aria-label="Dismiss this notice"
        onClick={() => {
          sessionStorage.setItem(GUIDELINES_DISMISS_KEY, "1");
          setHidden(true);
        }}
        className="shrink-0 text-muted transition hover:text-ink"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

export function SearchBar({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const router = useRouter();
  const params = useSearchParams();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    router.push(`/community?${next.toString()}`);
  }

  return (
    <form onSubmit={submit} role="search" className="relative">
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search posts and replies"
        aria-label="Search posts and replies"
        className="field pl-11"
      />
    </form>
  );
}

export function CategoryChips({
  categories,
  active,
}: {
  categories: Category[];
  active: string | null;
}) {
  const params = useSearchParams();

  function href(slug: string | null) {
    const next = new URLSearchParams(params.toString());
    if (slug) next.set("category", slug);
    else next.delete("category");
    const qs = next.toString();
    return `/community${qs ? `?${qs}` : ""}`;
  }

  const chips = [{ slug: null, label: "All" }, ...categories.map((c) => ({
    slug: c.slug as string | null,
    label: c.label,
  }))];

  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {chips.map((chip) => {
        const isActive = chip.slug === active;
        return (
          <a
            key={chip.slug ?? "all"}
            href={href(chip.slug)}
            aria-current={isActive ? "true" : undefined}
            className={`shrink-0 rounded-chip px-4 py-2 text-[14px] transition ${
              isActive
                ? "bg-ink text-cream shadow-chip"
                : "bg-surface text-muted shadow-chip hover:text-ink"
            }`}
          >
            {chip.label}
          </a>
        );
      })}
    </div>
  );
}
