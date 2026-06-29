"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppHeader } from "@/components/auth/HomeAccountNav";
import { TravelseedWordmark } from "@/components/brand/TravelseedWordmark";
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
    <main className="min-h-screen bg-slate-50 px-5 py-6 text-slate-950 sm:px-6">
      <AppHeader />
      <section className="mx-auto mt-16 grid w-full max-w-md gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_20px_40px_-10px_rgba(15,23,42,0.12)]">
        <div className="text-center">
          <TravelseedWordmark className="mx-auto block text-[1.5rem]" />
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
            {authMode === "sign-in" ? t("auth.signInTitle") : t("auth.signUpTitle")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {authMode === "sign-in"
              ? t("auth.signInBody")
              : t("auth.signUpBody")}
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button type="button" className="min-h-10 rounded-lg bg-white text-sm font-semibold text-slate-950 shadow-sm">
            Email
          </button>
          <button type="button" className="min-h-10 rounded-lg text-sm font-semibold text-slate-500" title="WhatsApp owner login can be connected later.">
            WhatsApp
          </button>
        </div>

        {!authReady ? <p className="text-sm text-slate-500">{t("auth.checking")}</p> : null}

        {session ? (
          <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">{t("auth.signedIn")}</p>
              <p className="mt-1 text-sm text-slate-600">{session.user.email}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setStatus("Checking your sites...");
                  void postLoginRedirectPath(session.access_token, redirectPath).then((path) => router.push(path));
                }}
                className="min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm"
              >
                {t("auth.continue")}
              </button>
              <button type="button" onClick={() => void handleSignOut()} className="text-sm font-semibold text-emerald-700">
                {t("nav.signOut")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-950">
              {t("create.account.email")}
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-950">
              {t("create.account.password")}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <button type="submit" className="min-h-12 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700">
              {authMode === "sign-in" ? t("auth.signInTitle") : t("auth.signUpTitle")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
                setStatus("");
              }}
              className="text-sm font-semibold text-emerald-700"
            >
              {authMode === "sign-in" ? t("create.account.create") : t("auth.backToSignIn")}
            </button>
          </form>
        )}

        {status ? <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{status}</p> : null}
      </section>
    </main>
  );
}
