"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { resortPayloadFromSite, siteFromResort } from "@/components/dashboard/data";
import { ConfirmDialog } from "@/components/dashboard/ui";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ResortConsoleData } from "@/types/dashboard";
import type { ResortWithMetrics } from "@/types/resort";

type StatusFilter = "all" | "published" | "draft";
type SortOption = "updated" | "name" | "status";

export function DashboardHub() {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sites, setSites] = useState<ResortConsoleData[]>([]);
  const [status, setStatus] = useState("Loading sites from database...");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOption, setSortOption] = useState<SortOption>("updated");
  const [workingSiteId, setWorkingSiteId] = useState<string | null>(null);
  const [sitePendingDelete, setSitePendingDelete] = useState<ResortConsoleData | null>(null);

  const publishedCount = useMemo(() => sites.filter((site) => site.status === "Published").length, [sites]);
  const draftCount = useMemo(() => sites.filter((site) => site.status !== "Published").length, [sites]);
  const typeOptions = useMemo(() => Array.from(new Set(sites.map((site) => site.type).filter(Boolean))).sort(), [sites]);
  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sites
      .filter((site) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          [site.name, site.slug, site.location, site.type, site.travelseedUrl, site.customDomain]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedQuery));
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "published" ? site.status === "Published" : site.status !== "Published");
        const matchesType = typeFilter === "all" || site.type === typeFilter;

        return matchesQuery && matchesStatus && matchesType;
      })
      .sort((first, second) => {
        if (sortOption === "name") {
          return first.name.localeCompare(second.name);
        }
        if (sortOption === "status") {
          return first.status.localeCompare(second.status) || first.name.localeCompare(second.name);
        }

        return dateValue(second.updatedAt) - dateValue(first.updatedAt);
      });
  }, [query, sites, sortOption, statusFilter, typeFilter]);

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
      <section className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="pointer-events-none fixed left-1/2 top-24 -z-10 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{sites.length} Sites</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Your <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">Sites</span>
              </h1>
              <p className="mt-1.5 max-w-lg text-sm leading-6 text-slate-500">Manage your Travelseed business websites and create new ones.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/create" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-medium text-white shadow-md ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-50 transition hover:bg-slate-800">
                <Icon name="plus" className="h-3.5 w-3.5" />
                Create New Site
              </Link>
            </div>
          </header>

          {!authReady ? <SiteSkeletonGrid /> : null}
          {authReady && !accessToken ? <HubMessage text={status} actionHref="/login?next=/dashboard" actionLabel="Sign in" /> : null}
          {authReady && accessToken ? (
            <>
              {status && sites.length > 0 ? <StatusBanner status={status} onRetry={() => accessToken && void loadSites(accessToken)} /> : null}
              <SummaryStrip total={sites.length} published={publishedCount} draft={draftCount} />
              <FilterToolbar
                query={query}
                onQueryChange={setQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                typeOptions={typeOptions}
                sortOption={sortOption}
                onSortOptionChange={setSortOption}
              />

              {sites.length > 0 ? (
                filteredSites.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredSites.map((site) => (
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
                  <HubMessage text="No sites match the current filters." actionLabel="Clear filters" onAction={() => {
                    setQuery("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setSortOption("updated");
                  }} />
                )
              ) : (
                status === "Loading sites from database..." ? <SiteSkeletonGrid /> : <EmptySitesState />
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

function SummaryStrip({ total, published, draft }: { total: number; published: number; draft: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Total sites" value={total.toString()} icon="layout" />
      <SummaryCard label="Published" value={published.toString()} icon="check" />
      <SummaryCard label="Draft / paused" value={draft.toString()} icon="clock" />
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.03),0_16px_32px_-18px_rgba(15,23,42,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function FilterToolbar({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  typeOptions,
  sortOption,
  onSortOptionChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  typeOptions: string[];
  sortOption: SortOption;
  onSortOptionChange: (value: SortOption) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_0_0_1px_rgba(15,23,42,0.03),0_16px_32px_-18px_rgba(15,23,42,0.28)] sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Icon name="search" className="h-4 w-4" />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search sites"
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </label>

      <div className="flex rounded-xl bg-slate-100 p-1">
        {([
          ["all", "All"],
          ["published", "Published"],
          ["draft", "Draft"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onStatusFilterChange(value)}
            className={`min-h-9 rounded-lg px-3.5 text-xs font-medium transition ${
              statusFilter === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="relative">
        <select
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value)}
          className="min-h-11 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-0 pl-4 pr-9 text-sm font-medium text-slate-700 outline-none transition hover:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="all">Business Type</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <Icon name="chevron" className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
      </label>

      <label className="relative">
        <select
          value={sortOption}
          onChange={(event) => onSortOptionChange(event.target.value as SortOption)}
          className="min-h-11 appearance-none rounded-xl border border-slate-200 bg-slate-50 py-0 pl-4 pr-9 text-sm font-medium text-slate-700 outline-none transition hover:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="updated">Recently updated</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
        </select>
        <Icon name="chevron" className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
      </label>
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
  const thumbnailUrl = site.heroImageUrl || site.gallery[0] || site.services.find((service) => service.imageUrl)?.imageUrl || "";
  const statusTone = site.status === "Published" ? "published" : "draft";
  const manageButtonClass = site.status === "Published" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" : "bg-slate-950 hover:bg-slate-800";

  return (
    <article className="group flex overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.03),0_20px_40px_-18px_rgba(15,23,42,0.28)] transition hover:border-emerald-200">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className={`relative aspect-video overflow-hidden ${thumbnailUrl ? "bg-slate-200" : thumbnailGradientFor(site.id)}`}>
          {thumbnailUrl ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${thumbnailUrl}")` }} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-emerald-700/70">
              <Icon name={businessIconFor(site.type)} className="h-12 w-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
          {site.status !== "Published" ? (
            <span className="absolute right-3 top-3 rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-slate-200 backdrop-blur">Draft — Not published</span>
          ) : null}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 px-3 py-2">
            <span className="min-w-0 truncate rounded-md bg-slate-950/60 px-2 py-0.5 font-mono text-[11px] text-white backdrop-blur">{site.travelseedUrl}</span>
            <Link href={`/${site.slug}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/20 text-white opacity-0 backdrop-blur transition hover:bg-white/35 group-hover:opacity-100" aria-label={`Preview ${site.name}`}>
              <Icon name="external" className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-950">{site.name}</h2>
              <p className="mt-0.5 truncate text-xs text-slate-500">Updated {lastUpdated}</p>
            </div>
            <button
              type="button"
              disabled={isWorking}
              onClick={() => onDelete(site)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`Delete ${site.name}`}
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusPill status={site.status} tone={statusTone} />
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              <Icon name={businessIconFor(site.type)} className="h-3 w-3" />
              {shortBusinessType(site.type)}
            </span>
            <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-100">{site.plan}</span>
          </div>

          <div className="mb-5 grid grid-cols-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <MiniMetric icon="eye" label="Views" value={site.monthlyVisitorsUsed} />
            <MiniMetric icon="whatsapp" label="WA Clicks" value={site.whatsappClicksUsed} bordered />
            <MiniMetric icon="inbox" label="Inquiries" value={site.inquiriesUsed} />
          </div>

          <div className="mt-auto flex items-center gap-2">
            <Link href={`/dashboard/${site.id}`} className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium text-white shadow-sm transition ${manageButtonClass}`}>
              <Icon name="edit" className="h-3.5 w-3.5" />
              Manage
            </Link>
            <Link href={`/${site.slug}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              <Icon name="eye" className="h-3.5 w-3.5 text-slate-500" />
              Preview
            </Link>
            <button
              type="button"
              disabled={isWorking}
              onClick={() => onStatusChange(site, !site.isActive)}
              className="inline-flex min-h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={site.isActive ? `Pause ${site.name}` : `Publish ${site.name}`}
            >
              <Icon name={site.isActive ? "pause" : "upload"} className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusBanner({ status, onRetry }: { status: string; onRetry: () => void }) {
  const isError = /could not|unable|network|not configured|sign in/i.test(status);

  return (
    <div className={`flex flex-col gap-3 rounded-xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${isError ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isError ? "bg-red-100 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
          <Icon name={isError ? "alert" : "check"} className="h-4 w-4" />
        </span>
        <p className={`text-sm font-medium ${isError ? "text-red-800" : "text-slate-700"}`}>{status}</p>
      </div>
      {isError ? (
        <button type="button" onClick={onRetry} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100">
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Retry
        </button>
      ) : null}
    </div>
  );
}

function StatusPill({ status, tone }: { status: ResortConsoleData["status"]; tone: "published" | "draft" }) {
  const isPublished = tone === "published";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${isPublished ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-slate-400"}`} />
      {status === "Paused" ? "Draft" : status}
    </span>
  );
}

function MiniMetric({ icon, label, value, bordered }: { icon: IconName; label: string; value: number; bordered?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col items-center text-center ${bordered ? "border-x border-slate-200" : ""}`}>
      <div className="mb-1 flex items-center gap-1 text-slate-500">
        <Icon name={icon} className={`h-3 w-3 ${icon === "whatsapp" ? "text-emerald-600" : ""}`} />
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-950">{formatCompactNumber(value)}</span>
    </div>
  );
}

function SiteSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.03),0_20px_40px_-18px_rgba(15,23,42,0.28)]">
          <div className="aspect-video animate-pulse bg-slate-100" style={{ animationDelay: `${index * 0.12}s` }} />
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="grid flex-1 gap-2">
                <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-3 w-1/3 animate-pulse rounded-lg bg-slate-100" />
              </div>
              <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
              <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-8 animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 flex-1 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptySitesState() {
  return (
    <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-100 bg-white p-8 text-center shadow-[0_0_0_1px_rgba(15,23,42,0.03),0_24px_60px_-20px_rgba(15,23,42,0.3)] sm:p-10">
      <div className="relative">
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[60px]" />
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
            <Icon name="leaf" className="h-9 w-9" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950">Create your first Travelseed site</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Import a public link or start manually to build a WhatsApp-first business website.</p>

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <Link href="/create" className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.03),0_16px_32px_-18px_rgba(15,23,42,0.28)] transition hover:border-emerald-300">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon name="sparkles" className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-bold text-slate-950">Import from link</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Paste an existing site, social, or OTA link and let AI draft the site.</p>
              <span className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-medium text-white">
                Generate AI Draft
                <Icon name="arrow" className="h-3 w-3" />
              </span>
            </Link>
            <Link href="/create" className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Icon name="edit" className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-bold text-slate-950">Start fresh</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Use the guided setup when you want full control from the first step.</p>
              <span className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-medium text-white">
                Begin Manual Setup
                <Icon name="arrow" className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
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

function dateValue(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 10000 ? "compact" : "standard" }).format(value);
}

function thumbnailGradientFor(id: string) {
  const gradients = [
    "bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200",
    "bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200",
    "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200",
    "bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200",
    "bg-gradient-to-br from-violet-50 via-violet-100 to-violet-200",
  ];
  const index = id.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
}

function shortBusinessType(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes("villa") || lower.includes("hotel") || lower.includes("resort")) return "Resort";
  if (lower.includes("cafe") || lower.includes("restaurant") || lower.includes("food")) return "Cafe";
  if (lower.includes("tour")) return "Tour";
  if (lower.includes("wellness") || lower.includes("spa") || lower.includes("salon")) return "Wellness";
  if (lower.includes("shop") || lower.includes("retail")) return "Retail";
  return type || "Business";
}

function businessIconFor(type: string): IconName {
  const lower = type.toLowerCase();
  if (lower.includes("cafe") || lower.includes("restaurant") || lower.includes("food")) return "coffee";
  if (lower.includes("tour")) return "map";
  if (lower.includes("wellness") || lower.includes("spa") || lower.includes("salon")) return "spa";
  if (lower.includes("shop") || lower.includes("retail")) return "store";
  return "hotel";
}

function HubMessage({
  text,
  actionHref,
  actionLabel,
  onAction,
}: {
  text: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-[0_0_0_1px_rgba(15,23,42,0.03),0_20px_40px_-18px_rgba(15,23,42,0.28)]">
      <div>
        <p className="text-lg font-semibold text-slate-950">{text}</p>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">
            {actionLabel}
          </Link>
        ) : null}
        {!actionHref && actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

type IconName =
  | "alert"
  | "arrow"
  | "check"
  | "chevron"
  | "clock"
  | "coffee"
  | "edit"
  | "external"
  | "eye"
  | "hotel"
  | "inbox"
  | "layout"
  | "leaf"
  | "map"
  | "pause"
  | "plus"
  | "refresh"
  | "search"
  | "spa"
  | "sparkles"
  | "store"
  | "trash"
  | "upload"
  | "whatsapp";

function Icon({ name, className }: { name: IconName; className: string }) {
  const strokeProps = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "alert":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><circle cx="12" cy="12" r="10" /><path d="M12 8v5" /><path d="M12 17h.01" /></svg>;
    case "arrow":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>;
    case "check":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M20 6 9 17l-5-5" /></svg>;
    case "chevron":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m6 9 6 6 6-6" /></svg>;
    case "clock":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
    case "coffee":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" /><path d="M16 10h2a3 3 0 0 1 0 6h-2" /><path d="M6 2v2" /><path d="M10 2v2" /><path d="M14 2v2" /></svg>;
    case "edit":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>;
    case "external":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>;
    case "eye":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "hotel":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M4 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14" /><path d="M16 10h2a2 2 0 0 1 2 2v9" /><path d="M8 9h.01" /><path d="M12 9h.01" /><path d="M9 21v-4h2v4" /></svg>;
    case "inbox":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="m5.5 5 13 0L22 12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7l3.5-7Z" /></svg>;
    case "layout":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>;
    case "leaf":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-9-1 9-5 16-9 16Z" /><path d="M4 21c4-6 8-9 14-12" /></svg>;
    case "map":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15" /><path d="M15 6v15" /></svg>;
    case "pause":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M8 5v14" /><path d="M16 5v14" /></svg>;
    case "plus":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
    case "refresh":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 21v-5h5" /><path d="M21 3v5h-5" /></svg>;
    case "search":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
    case "spa":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 21c0-5 3-8 8-8 0 5-3 8-8 8Z" /><path d="M12 21c0-5-3-8-8-8 0 5 3 8 8 8Z" /><path d="M12 14c-3-3-3-7 0-10 3 3 3 7 0 10Z" /></svg>;
    case "sparkles":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5L12 3Z" /><path d="M5 3v4" /><path d="M3 5h4" /><path d="M19 17v4" /><path d="M17 19h4" /></svg>;
    case "store":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M4 10h16l-1.5-5h-13L4 10Z" /><path d="M5 10v9h14v-9" /><path d="M8 19v-5h4v5" /><path d="M4 10c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2" /></svg>;
    case "trash":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 15H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>;
    case "upload":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></svg>;
    case "whatsapp":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M5.4 18.6A8.5 8.5 0 1 1 8 20l-4 1 1.4-2.4Z" /><path d="M9.5 8.8c.2 3 2.7 5.5 5.7 5.7" /></svg>;
  }
}
