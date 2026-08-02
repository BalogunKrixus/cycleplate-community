"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LikeButton } from "@/components/interactions/LikeButton";
import { FlagButton } from "@/components/interactions/FlagButton";
import { ReplyComposer } from "@/components/feed/ReplyComposer";
import {
  Avatar,
  AuthorBadge,
  Card,
  CategoryChip,
  timeAgo,
} from "@/components/ui/Primitives";
import { setPinned, softDelete } from "@/lib/actions";
import type { Category, FeedPost, FeedReply, Profile } from "@/lib/types";

export function PostCard({
  post,
  categories,
  viewer,
}: {
  post: FeedPost;
  categories: Category[];
  viewer: Profile | null;
}) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<FeedReply[] | null>(
    post.matching_replies ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const category = categories.find((c) => c.slug === post.category_slug);
  const isAdmin = viewer?.role === "admin";

  /* Replies load on expand rather than with the feed. Most posts are never
     opened, and loading every thread up front would make the feed pay for it. */
  async function loadReplies() {
    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from("replies")
      .select("*")
      .eq("post_id", post.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    let liked = new Set<string>();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && data?.length) {
      const { data: likeRows } = await supabase
        .from("likes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "reply")
        .in(
          "target_id",
          data.map((r) => r.id),
        );
      liked = new Set((likeRows ?? []).map((l) => l.target_id as string));
    }

    setReplies(
      (data ?? []).map((r) => ({
        ...(r as FeedReply),
        liked_by_viewer: liked.has(r.id as string),
      })),
    );
    setLoading(false);
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && replies === null) void loadReplies();
  }

  return (
    <Card className="animate-rise p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Avatar displayName={post.display_name} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-medium text-ink">
              {post.display_name}
            </span>
            <span className="text-[13px] text-faint">
              {timeAgo(post.created_at)}
            </span>
            {post.is_pinned ? (
              <span className="rounded-chip bg-ovulatory/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ovulatory">
                Pinned
              </span>
            ) : null}
            {category ? (
              <CategoryChip slug={category.slug} label={category.label} />
            ) : null}
          </div>

          <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {post.body}
          </p>

          <div className="mt-4 flex items-center gap-5">
            <LikeButton
              targetType="post"
              targetId={post.id}
              initialCount={post.like_count}
              initiallyLiked={post.liked_by_viewer}
              signedIn={!!viewer}
            />

            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" />
              </svg>
              <span className="tabular-nums">{post.reply_count}</span>
            </button>

            <div className="ml-auto flex items-center gap-3">
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        await setPinned(post.id, !post.is_pinned);
                        router.refresh();
                      })
                    }
                    className="text-[13px] text-muted transition hover:text-ink"
                  >
                    {post.is_pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        await softDelete("post", post.id);
                        router.refresh();
                      })
                    }
                    className="text-[13px] text-muted transition hover:text-menstrual"
                  >
                    Remove
                  </button>
                </>
              ) : null}
              <FlagButton
                targetType="post"
                targetId={post.id}
                signedIn={!!viewer}
              />
            </div>
          </div>
        </div>
      </div>

      {open ? (
        <div className="mt-5 pl-0 sm:pl-[52px]">
          {loading ? (
            <p className="text-[14px] text-faint">Loading replies</p>
          ) : (
            <div className="flex flex-col gap-4">
              {(replies ?? []).map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  viewer={viewer}
                  isAdmin={isAdmin}
                />
              ))}
              {replies?.length === 0 ? (
                <p className="text-[14px] text-faint">
                  No replies yet. Be the first to say something kind.
                </p>
              ) : null}
            </div>
          )}

          <ReplyComposer
            postId={post.id}
            viewer={viewer}
            onDone={() => void loadReplies()}
          />
        </div>
      ) : null}
    </Card>
  );
}

function ReplyItem({
  reply,
  viewer,
  isAdmin,
}: {
  reply: FeedReply;
  viewer: Profile | null;
  isAdmin: boolean;
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-cream p-4">
      <Avatar
        displayName={
          reply.author_role === "admin" ? "CyclePlate" : reply.display_name
        }
        size={32}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[14px] font-medium text-ink">
            {reply.author_role === "admin" ? "CyclePlate" : reply.display_name}
          </span>
          <AuthorBadge
            role={reply.author_role}
            category={reply.professional_category}
            categoryOther={reply.professional_category_other}
          />
          <span className="text-[12px] text-faint">
            {timeAgo(reply.created_at)}
          </span>
        </div>

        <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
          {reply.body}
        </p>

        <div className="mt-2.5 flex items-center gap-4">
          <LikeButton
            targetType="reply"
            targetId={reply.id}
            initialCount={reply.like_count}
            initiallyLiked={reply.liked_by_viewer}
            signedIn={!!viewer}
          />
          <div className="ml-auto flex items-center gap-3">
            {isAdmin ? (
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    await softDelete("reply", reply.id);
                    router.refresh();
                  })
                }
                className="text-[12px] text-muted transition hover:text-menstrual"
              >
                Remove
              </button>
            ) : null}
            <FlagButton
              targetType="reply"
              targetId={reply.id}
              signedIn={!!viewer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
