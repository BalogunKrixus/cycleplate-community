"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReply } from "@/lib/actions";
import { Button } from "@/components/ui/Primitives";
import { PROFESSIONAL_CATEGORIES, REPLY_MAX_LENGTH } from "@/lib/config";
import type { Profile, ProfessionalCategory } from "@/lib/types";

export function ReplyComposer({
  postId,
  viewer,
  onDone,
}: {
  postId: string;
  viewer: Profile | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* A professional confirms what they are answering as before the badge goes
     on. Asked once, then remembered on the profile. */
  const isProfessional = viewer?.role === "professional";
  const needsCategory = isProfessional && !viewer.professional_category;
  const [category, setCategory] = useState<ProfessionalCategory | "">(
    viewer?.professional_category ?? "",
  );
  const [otherTitle, setOtherTitle] = useState(
    viewer?.professional_category_other ?? "",
  );

  if (!viewer) {
    return (
      <p className="text-[14px] text-muted">
        <a href="/auth/sign-in" className="text-menstrual underline">
          Sign in
        </a>{" "}
        to reply.
      </p>
    );
  }

  async function submit() {
    setError(null);
    setBusy(true);
    const result = await createReply(
      postId,
      body,
      isProfessional ? ((category || null) as ProfessionalCategory | null) : null,
      isProfessional && category === "other" ? otherTitle : null,
    );
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    onDone();
    router.refresh();
  }

  const remaining = REPLY_MAX_LENGTH - body.length;

  return (
    <div className="mt-4">
      {needsCategory ? (
        <div className="mb-3 rounded-2xl bg-cream p-3">
          <label className="text-[13px] font-medium text-ink">
            You are replying as
          </label>
          <p className="mb-2 mt-0.5 text-[12px] text-muted">
            This shows on your reply and is remembered for next time.
          </p>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as ProfessionalCategory | "")
            }
            className="field"
          >
            <option value="">Choose one</option>
            {PROFESSIONAL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {category === "other" ? (
            <input
              value={otherTitle}
              onChange={(e) => setOtherTitle(e.target.value)}
              placeholder="Your title"
              maxLength={40}
              className="field mt-2"
            />
          ) : null}
        </div>
      ) : null}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={REPLY_MAX_LENGTH}
        placeholder="Share what helped you"
        aria-label="Your reply"
        className="field resize-none"
      />

      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-menstrual">
          {error}
        </p>
      ) : null}

      <div className="mt-2 flex items-center justify-between">
        <span
          className={`text-[12px] ${remaining < 100 ? "text-menstrual" : "text-faint"}`}
        >
          {remaining} left
        </span>
        <Button onClick={submit} disabled={busy || !body.trim()}>
          {busy ? "Posting" : "Reply"}
        </Button>
      </div>
    </div>
  );
}
