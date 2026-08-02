"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/actions";
import { Button } from "@/components/ui/Primitives";
import { POST_MAX_LENGTH } from "@/lib/config";
import type { Category, Profile } from "@/lib/types";

/* The floating pill and its modal. Visitors see the button too: hiding it would
   mean nobody discovers they can take part until they happen to sign up. */
export function ShareSomething({
  categories,
  viewer,
}: {
  categories: Category[];
  viewer: Profile | null;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit() {
    setError(null);
    setBusy(true);
    const result = await createPost(body, category || null);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    setCategory("");
    setOpen(false);
    router.refresh();
  }

  const remaining = POST_MAX_LENGTH - body.length;

  return (
    <>
      <button
        type="button"
        onClick={() => (viewer ? setOpen(true) : router.push("/auth/sign-in"))}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-chip bg-ink px-5 py-3.5
                   text-[15px] font-medium text-cream shadow-lift transition hover:-translate-y-0.5"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
        Share something
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Share something with the community"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl animate-rise rounded-card bg-surface p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[22px]">Share something</h2>
            <p className="mt-1 text-[14px] text-muted">
              You are posting as{" "}
              <span className="font-medium text-ink">{viewer?.display_name}</span>.
              Your real name and email are never shown.
            </p>

            <textarea
              autoFocus
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              maxLength={POST_MAX_LENGTH}
              placeholder="What is on your mind?"
              aria-label="Your post"
              className="field mt-4 resize-none"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Category, optional"
              className="field mt-3"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>

            {error ? (
              <p role="alert" className="mt-3 text-[13px] text-menstrual">
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex items-center justify-between">
              <span
                className={`text-[12px] ${remaining < 100 ? "text-menstrual" : "text-faint"}`}
              >
                {remaining} left
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={busy || !body.trim()}>
                  {busy ? "Posting" : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
