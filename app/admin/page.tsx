import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import type { Flag, Post, Reply } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderation | CyclePlate Community" };

export type QueueItem = {
  flag: Flag;
  body: string | null;
  displayName: string | null;
  isDeleted: boolean;
  createdAt: string | null;
};

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/community");

  const supabase = await createClient();

  const { data: flagRows } = await supabase
    .from("flags")
    .select("*")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(100);

  const flags = (flagRows ?? []) as Flag[];

  /* Two lookups rather than one per flag, which matters once a single bad post
     has been reported by a dozen people. */
  const postIds = flags.filter((f) => f.target_type === "post").map((f) => f.target_id);
  const replyIds = flags.filter((f) => f.target_type === "reply").map((f) => f.target_id);

  const [{ data: posts }, { data: replies }] = await Promise.all([
    postIds.length
      ? supabase.from("posts").select("*").in("id", postIds)
      : Promise.resolve({ data: [] as Post[] }),
    replyIds.length
      ? supabase.from("replies").select("*").in("id", replyIds)
      : Promise.resolve({ data: [] as Reply[] }),
  ]);

  const postById = new Map((posts ?? []).map((p) => [p.id, p as Post]));
  const replyById = new Map((replies ?? []).map((r) => [r.id, r as Reply]));

  const items: QueueItem[] = flags.map((flag) => {
    const target =
      flag.target_type === "post"
        ? postById.get(flag.target_id)
        : replyById.get(flag.target_id);

    return {
      flag,
      body: target?.body ?? null,
      displayName: target?.display_name ?? null,
      isDeleted: target?.is_deleted ?? false,
      createdAt: target?.created_at ?? null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14">
      <AdminNav current="moderation" />
      <h1 className="mt-4 text-[36px] leading-tight">Moderation</h1>
      <p className="mt-2 text-[15px] text-muted">
        Flagged content, most recent first. Removing something hides it from the
        feed without destroying it.
      </p>
      <ModerationQueue items={items} />
    </main>
  );
}

export function AdminNav({ current }: { current: "moderation" | "members" }) {
  const link = "text-[14px] transition";
  return (
    <nav className="flex items-center gap-5">
      <Link href="/community" className={`${link} text-muted hover:text-ink`}>
        Back to the community
      </Link>
      <span className="text-faint">|</span>
      <Link
        href="/admin"
        className={`${link} ${current === "moderation" ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
      >
        Moderation
      </Link>
      <Link
        href="/admin/members"
        className={`${link} ${current === "members" ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
      >
        Members
      </Link>
    </nav>
  );
}
