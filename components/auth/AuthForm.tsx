"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Primitives";
import { generateDisplayName } from "@/lib/displayName";

/* Sign up assigns a handle rather than asking for one, so nobody puts their
   real name on a post about endometriosis by accident. It can be changed once
   from account settings. */
export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const isSignUp = mode === "sign-up";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);

    const supabase = createClient();

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: generateDisplayName() } },
      });
      setBusy(false);

      if (error) {
        setError(error.message);
        return;
      }
      /* With email confirmation switched on there is no session yet, so say so
         rather than dropping them on a feed they cannot post to. */
      if (!data.session) {
        setNotice("Check your inbox to confirm your address, then sign in.");
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setBusy(false);

      if (error) {
        setError("That email and password did not match.");
        return;
      }
    }

    router.push("/community");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-16">
      <h1 className="text-[36px] leading-tight">
        {isSignUp ? "Join the community" : "Welcome back"}
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        {isSignUp
          ? "You post under a handle we generate for you. Your name and email are never shown."
          : "Sign in to post, reply and take part."}
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[14px] font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-[14px] font-medium"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
          {isSignUp ? (
            <p className="mt-1.5 text-[13px] text-faint">At least 8 characters.</p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-[13px] text-menstrual">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="text-[13px] text-follicular">
            {notice}
          </p>
        ) : null}

        <Button type="submit" disabled={busy} className="mt-2 w-full">
          {busy ? "One moment" : isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted">
        {isSignUp ? "Already a member? " : "New here? "}
        <Link
          href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}
          className="text-menstrual underline"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>

      <p className="mt-8 text-center text-[13px] text-faint">
        <Link href="/community" className="underline">
          Back to the community
        </Link>
      </p>
    </main>
  );
}
