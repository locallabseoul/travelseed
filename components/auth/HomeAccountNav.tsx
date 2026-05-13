"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function HomeAccountNav() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

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
        <Link href="/login?next=/create" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#18352f]">
          Log in
        </Link>
        <Link href="/sites/villa-jeruk" className="rounded-full bg-[#18352f] px-4 py-2 text-sm font-semibold text-white">
          Demo Resort
        </Link>
      </div>
    );
  }

  return (
    <details className="group relative">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] shadow-sm">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18352f] text-xs text-white">
          {(session.user.email ?? "U").slice(0, 1).toUpperCase()}
        </span>
        Profile
      </summary>
      <div className="absolute right-0 z-20 mt-3 grid w-64 gap-1 rounded-md border border-[#eadfce] bg-white p-2 text-sm shadow-[0_18px_55px_rgba(54,43,29,0.16)]">
        <p className="truncate px-3 py-2 text-xs font-medium text-[#51635b]">{session.user.email}</p>
        <Link href="/dashboard" className="rounded-md px-3 py-2 font-semibold text-[#18352f] hover:bg-[#f8f5ef]">
          Site management
        </Link>
        <Link href="/create" className="rounded-md px-3 py-2 font-semibold text-[#18352f] hover:bg-[#f8f5ef]">
          Build new site
        </Link>
        <Link href="/sites/villa-jeruk" className="rounded-md px-3 py-2 font-semibold text-[#18352f] hover:bg-[#f8f5ef]">
          Demo resort
        </Link>
        <button
          type="button"
          onClick={() => void supabase.auth.signOut()}
          className="rounded-md px-3 py-2 text-left font-semibold text-red-700 hover:bg-red-50"
        >
          Sign out
        </button>
      </div>
    </details>
  );
}

export function AppHeader({ className = "" }: { className?: string }) {
  return (
    <header className={`mx-auto flex max-w-7xl items-center justify-between ${className}`}>
      <Link href="/" className="text-sm font-semibold tracking-[0.22em] text-[#18352f]">
        TRAVELSEED
      </Link>
      <HomeAccountNav />
    </header>
  );
}
