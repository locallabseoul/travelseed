"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { siteFromResort } from "@/components/dashboard/data";
import { Badge } from "@/components/dashboard/ui";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ResortConsoleData } from "@/types/dashboard";
import type { Resort } from "@/types/resort";

export function DashboardHub() {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sites, setSites] = useState<ResortConsoleData[]>([]);
  const [status, setStatus] = useState("Loading sites from database...");

  const publishedCount = useMemo(() => sites.filter((site) => site.status === "Published").length, [sites]);
  const pausedCount = useMemo(() => sites.filter((site) => site.status === "Paused").length, [sites]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      setStatus("Supabase is not configured.");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAccessToken(nextSession?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadSites(token: string) {
    setStatus("Loading sites from database...");
    try {
      const response = await fetch("/api/operator/resorts", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not load sites.");
      }

      const loadedSites = ((data.resorts ?? []) as Resort[]).map(siteFromResort);
      setSites(loadedSites);
      setStatus(loadedSites.length > 0 ? "" : "No sites found in the database.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load sites.");
    }
  }

  useEffect(() => {
    if (accessToken) {
      void loadSites(accessToken);
    } else if (authReady) {
      setSites([]);
      setStatus("Sign in to view your sites.");
    }
  }, [accessToken, authReady]);

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-[#18352f]">
      <DashboardHeader />
      <section className="px-5 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-2xl border border-[#e8dfd0] bg-white p-6 shadow-[0_18px_60px_rgba(54,43,29,0.07)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Travelseed Console</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">Your sites</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f7b74]">
                  Manage each direct booking site from a focused operating console. Create a new site when you add another property or business.
                </p>
              </div>
              <Link href="/create" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#18352f] px-6 text-sm font-semibold text-white shadow-sm">
                Create new site
              </Link>
            </div>
          </header>

          {!authReady ? <HubMessage text="Checking account session..." /> : null}
          {authReady && !accessToken ? <HubMessage text={status} actionHref="/login?next=/dashboard" actionLabel="Sign in" /> : null}
          {authReady && accessToken ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard label="Total sites" value={sites.length.toString()} />
                <SummaryCard label="Published" value={publishedCount.toString()} />
                <SummaryCard label="Paused" value={pausedCount.toString()} />
              </div>

              {sites.length > 0 ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {sites.map((site) => (
                    <SiteCard key={site.id} site={site} />
                  ))}
                </div>
              ) : (
                <HubMessage text={status} actionHref="/create" actionLabel="Create your first site" />
              )}
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e8dfd0] bg-white p-5 shadow-[0_18px_60px_rgba(54,43,29,0.07)]">
      <p className="text-sm text-[#6f7b74]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[#18352f]">{value}</p>
    </div>
  );
}

function SiteCard({ site }: { site: ResortConsoleData }) {
  return (
    <article className="rounded-2xl border border-[#e8dfd0] bg-white p-5 shadow-[0_18px_60px_rgba(54,43,29,0.07)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-[#18352f]">{site.name}</h2>
            <Badge tone={site.status === "Published" ? "green" : "gray"}>{site.status}</Badge>
            <Badge tone="sand">{site.plan}</Badge>
          </div>
          <p className="mt-2 text-sm text-[#6f7b74]">{site.location}</p>
        </div>
        <span className="rounded-full bg-[#f8f5ef] px-3 py-1 text-xs font-semibold text-[#52615a]">{site.template}</span>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-[#fbfaf7] p-4 text-sm text-[#52615a]">
        <div className="flex items-center justify-between gap-4">
          <span>Travelseed URL</span>
          <span className="break-all text-right font-semibold text-[#18352f]">{site.travelseedUrl}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Custom domain</span>
          <span className="break-all text-right font-semibold text-[#18352f]">{site.customDomain || "Not connected"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>WhatsApp</span>
          <span className="text-right font-semibold text-[#18352f]">{site.whatsappNumber}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href={`/dashboard/${site.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
          Manage
        </Link>
        <Link href={`/sites/${site.slug}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
          View site
        </Link>
        <Link href={`/dashboard/${site.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
          Edit content
        </Link>
      </div>
    </article>
  );
}

function HubMessage({ text, actionHref, actionLabel }: { text: string; actionHref?: string; actionLabel?: string }) {
  return (
    <section className="flex min-h-[360px] items-center justify-center rounded-2xl border border-[#e8dfd0] bg-white p-6 text-center shadow-[0_18px_60px_rgba(54,43,29,0.07)]">
      <div>
        <p className="text-lg font-semibold text-[#18352f]">{text}</p>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
