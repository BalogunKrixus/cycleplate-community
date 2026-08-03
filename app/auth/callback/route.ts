import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/* Where the confirmation link in the sign up email lands.
 *
 * Supabase sends people here with a one time code rather than a session, and
 * the code has to be exchanged server side for the cookies that keep someone
 * signed in. Without this route the link would deposit them on a page holding a
 * code nothing reads, and they would have to sign in again by hand wondering
 * whether confirming had worked at all.
 *
 * Anything unexpected sends them to sign in rather than showing an error page.
 * A link that has already been used, or has expired, is not a fault worth
 * explaining: signing in is what they wanted to do either way. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/community`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/sign-in`);
}
