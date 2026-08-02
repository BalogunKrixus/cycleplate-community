import { redirect } from "next/navigation";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import { AdminNav } from "@/app/admin/page";
import { MemberManager } from "@/components/admin/MemberManager";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Members | CyclePlate Community" };

export interface MemberRow {
  id: string;
  display_name: string;
  email: string;
  role: "member" | "professional" | "admin";
  professional_category: Profile["professional_category"];
  professional_category_other: string | null;
  created_at: string;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/community");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const supabase = await createClient();

  /* Email comes from a security definer function rather than a table, so it is
     never readable by the feed. */
  const { data: results } = await supabase.rpc("search_members", { q: query });

  /* Roles are public, so the standing list of professionals needs no such care. */
  const { data: professionals } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "professional")
    .order("display_name");

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14">
      <AdminNav current="members" />
      <h1 className="mt-4 text-[36px] leading-tight">Members</h1>
      <p className="mt-2 text-[15px] text-muted">
        Search by display name or email, and grant or revoke Professional
        status.
      </p>

      <MemberManager
        query={query}
        results={(results ?? []) as MemberRow[]}
        professionals={(professionals ?? []) as Profile[]}
        currentAdminId={admin.id}
      />
    </main>
  );
}
