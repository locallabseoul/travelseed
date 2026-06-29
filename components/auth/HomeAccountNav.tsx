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
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <Link href="/pricing" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:inline-flex">
          {t("nav.pricing")}
        </Link>
        <Link href="/login?next=/create" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
          {t("nav.login")}
        </Link>
        <Link href="/create" className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/10 hover:bg-neutral-800">
          {t("nav.build")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <LanguageToggle className="hidden sm:inline-flex" />
      <Link href="/pricing" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 md:inline-flex">
        {t("nav.pricing")}
      </Link>
      <details className="group relative">
        <summary className="relative flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
            {(session.user.email ?? "U").slice(0, 1).toUpperCase()}
          </span>
          {t("nav.profile")}
          {hasNotifications ? <NotificationCountBadge count={notificationCount} className="-right-1 -top-1" /> : null}
        </summary>
        <div className="absolute right-0 z-20 mt-3 grid w-64 gap-1 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
          <p className="truncate px-3 py-2 text-xs font-medium text-slate-500">{session.user.email}</p>
          <div className="px-3 py-2 sm:hidden">
            <LanguageToggle />
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
  return (
    <header className={`mx-auto flex max-w-7xl items-center justify-between ${className}`}>
      <Link href="/" className="inline-flex items-center">
        <TravelseedWordmark tone={brandTone} />
      </Link>
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
