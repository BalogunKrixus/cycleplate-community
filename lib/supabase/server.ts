import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/* Server side Supabase client. Reads the session from cookies so server
   components can render the feed already knowing who is looking at it. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Called from a server component, where cookies cannot be written.
               The middleware refreshes the session instead, so this is safe to
               swallow. */
          }
        },
      },
    },
  );
}

/* The signed in profile, or null. Every caller needs the profile rather than
   just the auth user, because role and display name live on the profile. */
export async function getViewer(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/* Roles are also enforced by row level security in Postgres. This is for
   deciding what to render, not for deciding what is allowed. */
export async function requireAdmin(): Promise<Profile | null> {
  const viewer = await getViewer();
  return viewer?.role === "admin" ? viewer : null;
}
