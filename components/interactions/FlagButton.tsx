"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { flagContent } from "@/lib/actions";
import { Button } from "@/components/ui/Primitives";
import type { TargetType } from "@/lib/types";

/* Flagging stays quiet on purpose. A loud confirmation tells everyone nearby
   that a person reported something, and the point is that it costs nothing to
   do the right thing. */
export function FlagButton({
  targetType,
  targetId,
  signedIn,
}: {
  targetType: TargetType;
  targetId: string;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (done) {
    return (
      <span className="text-[13px] text-faint">Thank you, we will look</span>
    );
  }

  async function submit() {
    setBusy(true);
    const result = await flagContent(targetType, targetId, reason || null);
    setBusy(false);
    if (result.ok) {
      setDone(true);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (signedIn ? setOpen(true) : router.push("/auth/sign-in"))}
        aria-label="Flag this as inappropriate"
        title="Flag this as inappropriate"
        className="text-faint transition hover:text-menstrual"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 22V4a6 6 0 0 1 8 0 6 6 0 0 0 8 0v10a6 6 0 0 1-8 0 6 6 0 0 0-8 0" />
        </svg>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Flag this content"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md animate-rise rounded-card bg-surface p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[20px]">Flag this</h2>
            <p className="mt-1 text-[14px] text-muted">
              A moderator will take a look. You can add a note if it helps,
              though it is not required.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Optional"
              className="field mt-4 resize-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={busy}>
                {busy ? "Sending" : "Flag it"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
