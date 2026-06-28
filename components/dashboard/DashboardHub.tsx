"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { resortPayloadFromSite, siteFromResort } from "@/components/dashboard/data";
import { Badge, ConfirmDialog } from "@/components/dashboard/ui";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ResortConsoleData } from "@/types/dashboard";
import type { ResortWithMetrics } from "@/types/resort";

export function DashboardHub() {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sites, setSites] = useState<ResortConsoleData[]>([]);
  const [status, setStatus] = useState("Loading sites from database...");
  const [workingSiteId, setWorkingSiteId] = useState<string | null>(null);
  const [sitePendingDelete, setSitePendingDelete] = useState<ResortConsoleData | null>(null);

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

      const loadedSites = ((data.resorts ?? []) as ResortWithMetrics[]).map(siteFromResort);
      setSites(loadedSites);
      setStatus(loadedSites.length > 0 ? "" : "No sites found in the database.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load sites.");
    }
  }

  async function updateSiteStatus(site: ResortConsoleData, nextActiveState: boolean) {
    if (!accessToken) {
      setStatus("Sign in to manage your sites.");
      return;
    }

    const nextSite: ResortConsoleData = {
      ...site,
      isActive: nextActiveState,
      status: nextActiveState ? "Published" : "Paused",
    };

    setWorkingSiteId(site.id);
    setStatus(nextActiveState ? "Publishing site..." : "Pausing site...");
    try {
      const response = await fetch(`/api/operator/resorts/${site.id}`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ resort: resortPayloadFromSite(nextSite) }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not update site status.");
      }

      const updatedSite = siteFromResort({
        ...(data.resort as ResortWithMetrics),
        whatsapp_clicks_count: site.whatsappClicksUsed,
      });
      setSites((currentSites) => currentSites.map((currentSite) => (currentSite.id === site.id ? updatedSite : currentSite)));
      setStatus(`${updatedSite.name} is now ${updatedSite.status.toLowerCase()}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update site status.");
    } finally {
      setWorkingSiteId(null);
    }
  }

  async function deleteSite(site: ResortConsoleData) {
    if (!accessToken) {
      setStatus("Sign in to manage your sites.");
      return;
    }

    setWorkingSiteId(site.id);
    setStatus("Deleting site...");
    try {
      const response = await fetch(`/api/operator/resorts/${site.id}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not delete site.");
      }

      setSites((currentSites) => currentSites.filter((currentSite) => currentSite.id !== site.id));
      setStatus(`${site.name} was deleted.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete site.");
    } finally {
      setWorkingSiteId(null);
    }
  }

  function requestDeleteSite(site: ResortConsoleData) {
    setSitePendingDelete(site);
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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <DashboardHeader />
      <section className="px-5 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Travelseed Console</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">Your sites</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Manage each WhatsApp-ready business site from a focused operating console. Create a new site when you add another business, branch, or brand.
                </p>
              </div>
              <Link href="/create" className="inline-flex min-h-12 items-center justify-center rounded-md bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm">
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
              {status ? <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">{status}</p> : null}

              {sites.length > 0 ? (
                <div className="grid gap-4">
                  {sites.map((site) => (
                    <SiteCard
                      key={site.id}
                      site={site}
                      isWorking={workingSiteId === site.id}
                      onDelete={requestDeleteSite}
                      onStatusChange={updateSiteStatus}
                    />
                  ))}
                </div>
              ) : (
                <HubMessage text={status} actionHref="/create" actionLabel="Create your first site" />
              )}
            </>
          ) : null}
        </div>
      </section>
      <ConfirmDialog
        open={Boolean(sitePendingDelete)}
        options={sitePendingDelete ? {
          title: `Delete ${sitePendingDelete.name}?`,
          description: "This removes the site and its uploaded images. This cannot be undone.",
          confirmLabel: "Delete site",
          cancelLabel: "Cancel",
          tone: "danger",
        } : null}
        onCancel={() => setSitePendingDelete(null)}
        onConfirm={() => {
          const site = sitePendingDelete;
          setSitePendingDelete(null);
          if (site) {
            void deleteSite(site);
          }
        }}
      />
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SiteCard({
  site,
  isWorking,
  onDelete,
  onStatusChange,
}: {
  site: ResortConsoleData;
  isWorking: boolean;
  onDelete: (site: ResortConsoleData) => void;
  onStatusChange: (site: ResortConsoleData, nextActiveState: boolean) => void;
}) {
  const lastUpdated = formatDate(site.updatedAt);
  const created = formatDate(site.createdAt);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-slate-950">{site.name}</h2>
            <Badge tone={site.status === "Published" ? "green" : "gray"}>{site.status}</Badge>
            <Badge tone="sand">{site.plan}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600">{site.location}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{site.template}</span>
      </div>

      <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-100 md:grid-cols-2 xl:grid-cols-5">
        <div className="grid gap-1 xl:col-span-2">
          <span>Travelseed URL</span>
          <span className="break-all font-semibold text-slate-950">{site.travelseedUrl}</span>
        </div>
        <div className="grid gap-1 xl:col-span-2">
          <span>Custom domain</span>
          <span className="break-all font-semibold text-slate-950">{site.customDomain || "Not connected"}</span>
        </div>
        <div className="grid gap-1">
          <span>WhatsApp</span>
          <span className="font-semibold text-slate-950">{site.whatsappNumber}</span>
        </div>
        <div className="grid gap-1">
          <span>Created</span>
          <span className="font-semibold text-slate-950">{created}</span>
        </div>
        <div className="grid gap-1">
          <span>Last updated</span>
          <span className="font-semibold text-slate-950">{lastUpdated}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:justify-end">
        <Link href={`/dashboard/${site.id}`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white">
          Manage
        </Link>
        <Link href={`/${site.slug}`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
          View site
        </Link>
        <button
          type="button"
          disabled={isWorking}
          onClick={() => onStatusChange(site, !site.isActive)}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {site.isActive ? "Pause" : "Publish"}
        </button>
        <button
          type="button"
          disabled={isWorking}
          onClick={() => onDelete(site)}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-red-50 px-5 text-sm font-semibold text-red-700 ring-1 ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function HubMessage({ text, actionHref, actionLabel }: { text: string; actionHref?: string; actionLabel?: string }) {
  return (
    <section className="flex min-h-[360px] items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div>
        <p className="text-lg font-semibold text-slate-950">{text}</p>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white">
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
