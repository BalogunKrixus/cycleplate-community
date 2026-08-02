import { redirect } from "next/navigation";
import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { AccountSettings } from "@/components/auth/AccountSettings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account | CyclePlate Community" };

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/sign-in");

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-14">
      <Link href="/community" className="text-[14px] text-muted hover:text-ink">
        Back to the community
      </Link>
      <h1 className="mt-4 text-[36px] leading-tight">Your account</h1>
      <AccountSettings viewer={viewer} />
    </main>
  );
}
