"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
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
        <Link href="/login?next=/create" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#18352f]">
          {t("nav.login")}
        </Link>
        <Link href="/create" className="rounded-full bg-[#18352f] px-4 py-2 text-sm font-semibold text-white">
          {t("nav.build")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <LanguageToggle className="hidden sm:inline-flex" />
      <details className="group relative">
        <summary className="relative flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] shadow-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18352f] text-xs text-white">
            {(session.user.email ?? "U").slice(0, 1).toUpperCase()}
          </span>
          {t("nav.profile")}
          {hasNotifications ? <NotificationCountBadge count={notificationCount} className="-right-1 -top-1" /> : null}
        </summary>
        <div className="absolute right-0 z-20 mt-3 grid w-64 gap-1 rounded-md border border-[#eadfce] bg-white p-2 text-sm shadow-[0_18px_55px_rgba(54,43,29,0.16)]">
          <p className="truncate px-3 py-2 text-xs font-medium text-[#51635b]">{session.user.email}</p>
          <div className="px-3 py-2 sm:hidden">
            <LanguageToggle />
          </div>
          <Link href="/dashboard" className="rounded-md px-3 py-2 font-semibold text-[#18352f] hover:bg-[#f8f5ef]">
            {t("nav.management")}
          </Link>
          <Link href="/create" className="rounded-md px-3 py-2 font-semibold text-[#18352f] hover:bg-[#f8f5ef]">
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

export function AppHeader({ className = "", notificationCount = 0 }: { className?: string; notificationCount?: number }) {
  return (
    <header className={`mx-auto flex max-w-7xl items-center justify-between ${className}`}>
      <Link href="/" className="text-sm font-semibold tracking-[0.22em] text-[#18352f]">
        TRAVELSEED
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
