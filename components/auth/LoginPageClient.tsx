"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function LoginPageClient({ redirectPath = "/create" }: { redirectPath?: string }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setStatus("Supabase is not configured.");
      return;
    }

    setStatus(authMode === "sign-in" ? "Signing in..." : "Creating account...");

    if (authMode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
        },
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      setPassword("");
      setAuthMode("sign-in");
      setStatus("Check your email to verify the account, then sign in.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setPassword("");
    setStatus("");
    router.push(redirectPath);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setStatus("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef] px-5 py-10 text-[#18352f]">
      <section className="grid w-full max-w-md gap-5 rounded-md bg-white p-6 shadow-[0_24px_80px_rgba(54,43,29,0.08)]">
        <div>
          <Link href="/" className="text-sm font-semibold tracking-[0.22em]">
            TRAVELSEED
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">
            {authMode === "sign-in" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#51635b]">
            {authMode === "sign-in"
              ? "Sign in to build or manage your direct booking site."
              : "Create an account and verify your email before publishing."}
          </p>
        </div>

        {!authReady ? <p className="text-sm text-[#51635b]">Checking session...</p> : null}

        {session ? (
          <div className="grid gap-4 rounded-md border border-[#eadfce] bg-[#fbf8f1] p-4">
            <div>
              <p className="text-sm font-semibold">Signed in</p>
              <p className="mt-1 text-sm text-[#51635b]">{session.user.email}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push(redirectPath)}
                className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white"
              >
                Continue
              </button>
              <button type="button" onClick={() => void handleSignOut()} className="text-sm font-semibold text-[#0f5f6b]">
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="min-h-11 rounded-md border border-[#d8cebb] bg-white px-3 outline-none focus:border-[#18352f]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="min-h-11 rounded-md border border-[#d8cebb] bg-white px-3 outline-none focus:border-[#18352f]"
              />
            </label>
            <button type="submit" className="min-h-12 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
              {authMode === "sign-in" ? "Sign in" : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
                setStatus("");
              }}
              className="text-sm font-semibold text-[#0f5f6b]"
            >
              {authMode === "sign-in" ? "Create an account" : "Back to sign in"}
            </button>
          </form>
        )}

        {status ? <p className="rounded-md bg-[#f8f5ef] p-3 text-sm text-[#51635b]">{status}</p> : null}
      </section>
    </main>
  );
}
