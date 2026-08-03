/* The two values every Supabase client needs.
 *
 * Read through here rather than inline, so a missing one fails with the name of
 * the variable and the place to set it, instead of a null reference thrown from
 * somewhere inside the Supabase client. Getting these wrong on a fresh
 * deployment is by far the most likely way this app breaks, and the default
 * failure gives no clue which of the two is at fault.
 *
 * The literal process.env.NEXT_PUBLIC_* expressions have to stay written out in
 * full: Next.js substitutes them at build time by matching the text, so
 * building the name dynamically would leave them undefined in the browser.
 */
export function supabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !key ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
    ]
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `Supabase is not configured. Missing: ${missing}. ` +
        "On Vercel these go in Settings, Environment Variables, set for every " +
        "environment, and the project has to be redeployed afterwards because " +
        "NEXT_PUBLIC values are baked in at build time. Locally they go in " +
        ".env.local. See .env.local.example.",
    );
  }

  return { url, key };
}
