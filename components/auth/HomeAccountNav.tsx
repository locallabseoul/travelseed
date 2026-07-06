"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { TravelseedWordmark } from "@/components/brand/TravelseedWordmark";
import { LanguageToggle, useLanguage } from "@/components/i18n/LanguageProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function HomeAccountNav({ notificationCount = 0 }: { notificationCount?: number }) {
  const { t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const hasNotifications = notificationCount > 0;

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

  if (!authReady) {
    return <span className="h-10 w-24 rounded-full bg-white/40" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-4">
        <LanguageToggle />
        <Link href="/login?next=/create" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:inline-flex">
          {t("nav.login")}
        </Link>
        <Link href="/create" className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:bg-neutral-800 hover:shadow-lg">
          {t("nav.build")}
        </Link>
      </div>
    );
  }

  const email = session.user.email ?? "";
  const metadata = session.user.user_metadata as { full_name?: string; name?: string } | null;
  const displayName = metadata?.full_name?.trim() || metadata?.name?.trim() || email.split("@")[0] || t("nav.profile");
  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <LanguageToggle />
      <details className="group relative">
        <summary className="relative flex min-h-10 cursor-pointer list-none items-center gap-3 border-l border-slate-200 pl-4">
          <span className="hidden text-right sm:block">
            <span className="block max-w-36 truncate text-xs font-bold leading-tight text-slate-950">{displayName}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Business Pro</span>
          </span>
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm ring-2 ring-white transition group-hover:ring-emerald-500/30">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          {hasNotifications ? <NotificationCountBadge count={notificationCount} className="-right-1 -top-1" /> : null}
        </summary>
        <div className="absolute right-0 z-20 mt-3 grid w-64 gap-1 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
            <p className="mt-1 truncate text-xs font-medium text-slate-500">{email}</p>
          </div>
          <Link href="/dashboard" className="rounded-xl px-3 py-2 font-semibold text-slate-900 hover:bg-slate-50">
            {t("nav.management")}
          </Link>
          <Link href="/create" className="rounded-xl px-3 py-2 font-semibold text-slate-900 hover:bg-slate-50">
            {t("nav.newSite")}
          </Link>
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="rounded-md px-3 py-2 text-left font-semibold text-red-700 hover:bg-red-50"
          >
            {t("nav.signOut")}
          </button>
        </div>
      </details>
    </div>
  );
}

export function AppHeader({
  className = "",
  notificationCount = 0,
  brandTone = "dark",
}: {
  className?: string;
  notificationCount?: number;
  brandTone?: "dark" | "light";
}) {
  const { t } = useLanguage();
  const navLinkClassName = brandTone === "light"
    ? "text-white/72 hover:text-white"
    : "text-slate-600 hover:text-slate-950";

  return (
    <header className={`mx-auto flex max-w-7xl items-center justify-between ${className}`}>
      <div className="flex items-center gap-8">
        <Link href="/" className="inline-flex items-center">
          <TravelseedWordmark tone={brandTone} />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/pricing" className={`text-sm font-medium transition ${navLinkClassName}`}>
            {t("nav.pricing")}
          </Link>
        </nav>
      </div>
      <HomeAccountNav notificationCount={notificationCount} />
    </header>
  );
}

function NotificationCountBadge({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span className={`absolute flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#b4362a] px-1.5 text-[10px] font-bold leading-none text-white ring-2 ring-white ${className}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
