"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppHeader } from "@/components/auth/HomeAccountNav";
import { postLoginRedirectPath } from "@/components/auth/post-login-redirect";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function LoginPageClient({ redirectPath = "/create" }: { redirectPath?: string }) {
  const router = useRouter();
  const { t } = useLanguage();
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setPassword("");
    setStatus("Checking your sites...");
    router.push(await postLoginRedirectPath(data.session?.access_token, redirectPath));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setStatus("");
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] px-5 py-6 text-[#18352f] sm:px-6">
      <AppHeader />
      <section className="mx-auto mt-20 grid w-full max-w-md gap-5 rounded-md bg-white p-6 shadow-[0_24px_80px_rgba(54,43,29,0.08)]">
        <div>
          <h1 className="text-3xl font-semibold">
            {authMode === "sign-in" ? t("auth.signInTitle") : t("auth.signUpTitle")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#51635b]">
            {authMode === "sign-in"
              ? t("auth.signInBody")
              : t("auth.signUpBody")}
          </p>
        </div>

        {!authReady ? <p className="text-sm text-[#51635b]">{t("auth.checking")}</p> : null}

        {session ? (
          <div className="grid gap-4 rounded-md border border-[#eadfce] bg-[#fbf8f1] p-4">
            <div>
              <p className="text-sm font-semibold">{t("auth.signedIn")}</p>
              <p className="mt-1 text-sm text-[#51635b]">{session.user.email}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setStatus("Checking your sites...");
                  void postLoginRedirectPath(session.access_token, redirectPath).then((path) => router.push(path));
                }}
                className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white"
              >
                {t("auth.continue")}
              </button>
              <button type="button" onClick={() => void handleSignOut()} className="text-sm font-semibold text-[#0f5f6b]">
                {t("nav.signOut")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              {t("create.account.email")}
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="min-h-11 rounded-md border border-[#d8cebb] bg-white px-3 outline-none focus:border-[#18352f]"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("create.account.password")}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="min-h-11 rounded-md border border-[#d8cebb] bg-white px-3 outline-none focus:border-[#18352f]"
              />
            </label>
            <button type="submit" className="min-h-12 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
              {authMode === "sign-in" ? t("auth.signInTitle") : t("auth.signUpTitle")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
                setStatus("");
              }}
              className="text-sm font-semibold text-[#0f5f6b]"
            >
              {authMode === "sign-in" ? t("create.account.create") : t("auth.backToSignIn")}
            </button>
          </form>
        )}

        {status ? <p className="rounded-md bg-[#f8f5ef] p-3 text-sm text-[#51635b]">{status}</p> : null}
      </section>
    </main>
  );
}
