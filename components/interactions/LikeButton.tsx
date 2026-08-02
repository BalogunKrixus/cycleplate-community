"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TargetType } from "@/lib/types";

/* Liking is optimistic. It is a low stakes action and waiting on a round trip
   to fill a heart feels broken, so the count moves immediately and rolls back
   if the write fails. */
export function LikeButton({
  targetType,
  targetId,
  initialCount,
  initiallyLiked,
  signedIn,
}: {
  targetType: TargetType;
  targetId: string;
  initialCount: number;
  initiallyLiked: boolean;
  signedIn: boolean;
}) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function toggle() {
    if (!signedIn) {
      router.push("/auth/sign-in");
      return;
    }
    if (busy) return;

    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setBusy(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      setBusy(false);
      router.push("/auth/sign-in");
      return;
    }

    const { error } = next
      ? await supabase.from("likes").insert({
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
        })
      : await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("target_type", targetType)
          .eq("target_id", targetId);

    if (error) {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } else {
      startTransition(() => router.refresh());
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Remove your like" : "Like this"}
      className="inline-flex items-center gap-1.5 text-[13px] text-muted transition hover:text-menstrual"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? "#B23A4B" : "none"}
        stroke={liked ? "#B23A4B" : "currentColor"}
        strokeWidth="1.8"
        className={liked ? "animate-peak" : ""}
        aria-hidden="true"
      >
        <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
