"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AICopyManager } from "@/components/dashboard/AICopyManager";
import { AnalyticsView } from "@/components/dashboard/AnalyticsView";
import { ContentManager } from "@/components/dashboard/ContentManager";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DesignManager } from "@/components/dashboard/DesignManager";
import { DomainManager } from "@/components/dashboard/DomainManager";
import { ImportManager } from "@/components/dashboard/ImportManager";
import { InquiriesManager } from "@/components/dashboard/InquiriesManager";
import { OffersManager } from "@/components/dashboard/OffersManager";
import { PlanBillingView } from "@/components/dashboard/PlanBillingView";
import { ReviewsView } from "@/components/dashboard/ReviewsView";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { SiteStructureManager } from "@/components/dashboard/SiteStructureManager";
import { SetupWizard } from "@/components/dashboard/SetupWizard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { VouchersManager } from "@/components/dashboard/VouchersManager";
import { WhatsAppManager } from "@/components/dashboard/WhatsAppManager";
import { resortPayloadFromSite, siteFromResort } from "@/components/dashboard/data";
import { effectivePlanType, planConfig } from "@/components/dashboard/subscriptionConfig";
import { ConfirmDialog } from "@/components/dashboard/ui";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DashboardConfirmOptions, DashboardNotificationSummary, DashboardTab, DashboardUnsavedChanges, ResortConsoleData } from "@/types/dashboard";
import type { ResortWithMetrics } from "@/types/resort";

const emptyNotifications: DashboardNotificationSummary = {
  total: 0,
  items: [],
  byTab: {},
};

function renderTab(
  activeTab: DashboardTab,
  selectedSite: ResortConsoleData,
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>,
  onTabChange: (tab: DashboardTab) => void,
  accessToken: string | null,
  operatorFetch: (path: string, init?: RequestInit) => Promise<unknown>,
  onUnsavedChangesChange: (state: DashboardUnsavedChanges) => void,
  requestConfirmation: (options: DashboardConfirmOptions, onConfirm: () => void) => void,
  onNotificationsRefresh: () => void,
) {
  switch (activeTab) {
    case "setup":
      return <SetupWizard site={selectedSite} onTabChange={onTabChange} />;
    case "import":
      return <ImportManager site={selectedSite} operatorFetch={operatorFetch} onSiteUpdate={onSiteUpdate} onUnsavedChangesChange={onUnsavedChangesChange} />;
    case "aiCopy":
      return <AICopyManager site={selectedSite} operatorFetch={operatorFetch} onSiteUpdate={onSiteUpdate} onUnsavedChangesChange={onUnsavedChangesChange} />;
    case "content":
      if (planConfig[effectivePlanType(selectedSite)].siteType !== "landing") {
        return <SiteStructureManager site={selectedSite} accessToken={accessToken} operatorFetch={operatorFetch} onSiteUpdate={onSiteUpdate} onTabChange={onTabChange} onUnsavedChangesChange={onUnsavedChangesChange} requestConfirmation={requestConfirmation} />;
      }
      return <ContentManager site={selectedSite} accessToken={accessToken} onSiteUpdate={onSiteUpdate} onTabChange={onTabChange} onUnsavedChangesChange={onUnsavedChangesChange} />;
    case "offers":
      return <OffersManager site={selectedSite} accessToken={accessToken} onSiteUpdate={onSiteUpdate} onUnsavedChangesChange={onUnsavedChangesChange} />;
    case "structure":
      return <SiteStructureManager site={selectedSite} accessToken={accessToken} operatorFetch={operatorFetch} onSiteUpdate={onSiteUpdate} onTabChange={onTabChange} onUnsavedChangesChange={onUnsavedChangesChange} requestConfirmation={requestConfirmation} />;
    case "design":
      return <DesignManager site={selectedSite} onSiteUpdate={onSiteUpdate} onUnsavedChangesChange={onUnsavedChangesChange} />;
    case "whatsapp":
      return <WhatsAppManager site={selectedSite} onSiteUpdate={onSiteUpdate} onUnsavedChangesChange={onUnsavedChangesChange} />;
    case "inquiries":
      return <InquiriesManager site={selectedSite} operatorFetch={operatorFetch} onTabChange={onTabChange} onNotificationsRefresh={onNotificationsRefresh} />;
    case "vouchers":
      return <VouchersManager site={selectedSite} operatorFetch={operatorFetch} />;
    case "domain":
      return <DomainManager site={selectedSite} onSiteUpdate={onSiteUpdate} operatorFetch={operatorFetch} onUnsavedChangesChange={onUnsavedChangesChange} />;
    case "analytics":
      return <AnalyticsView site={selectedSite} />;
    case "reviews":
      return <ReviewsView site={selectedSite} accessToken={accessToken} />;
    case "plan":
      return <PlanBillingView site={selectedSite} onSiteUpdate={onSiteUpdate} requestConfirmation={requestConfirmation} />;
    case "settings":
      return <SettingsView site={selectedSite} onSiteUpdate={onSiteUpdate} onUnsavedChangesChange={onUnsavedChangesChange} requestConfirmation={requestConfirmation} />;
    case "dashboard":
    default:
      return <DashboardOverview site={selectedSite} onTabChange={onTabChange} />;
  }
}

export function DashboardShell({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [sites, setSites] = useState<ResortConsoleData[]>([]);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading sites from database...");
  const [notifications, setNotifications] = useState<DashboardNotificationSummary>(emptyNotifications);
  const [unsavedChanges, setUnsavedChanges] = useState<DashboardUnsavedChanges>({ isDirty: false, title: "", description: "" });
  const [confirmRequest, setConfirmRequest] = useState<(DashboardConfirmOptions & { onConfirm: () => void }) | null>(null);
  const selectedSite = sites.find((site) => site.id === siteId) ?? null;

  const requestConfirmation = useCallback((options: DashboardConfirmOptions, onConfirm: () => void) => {
    setConfirmRequest({ ...options, onConfirm });
  }, []);

  const runWithUnsavedGuard = useCallback((onConfirm: () => void) => {
    if (!unsavedChanges.isDirty) {
      onConfirm();
      return;
    }

    requestConfirmation({
      title: unsavedChanges.title || "Discard unsaved changes?",
      description: unsavedChanges.description || "You have unsaved changes. Continue without saving?",
      confirmLabel: "Discard changes",
      cancelLabel: "Keep editing",
      tone: "danger",
    }, () => {
      setUnsavedChanges({ isDirty: false, title: "", description: "" });
      onConfirm();
    });
  }, [requestConfirmation, unsavedChanges]);

  const handleTabChange = useCallback((tab: DashboardTab) => {
    const nextTab = tab === "content" && selectedSite && planConfig[effectivePlanType(selectedSite)].siteType !== "landing" ? "structure" : tab;

    if (nextTab === activeTab) {
      return;
    }

    runWithUnsavedGuard(() => setActiveTab(nextTab));
  }, [activeTab, runWithUnsavedGuard, selectedSite]);

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

  const operatorFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!accessToken) {
      throw new Error("Sign in before managing sites.");
    }

    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${accessToken}`);
    if (init.body && !(init.body instanceof FormData)) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(path, { ...init, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error ?? "Request failed.");
    }

    return data;
  }, [accessToken]);

  const loadNotifications = useCallback(async (nextSiteId: string) => {
    try {
      const data = await operatorFetch(`/api/operator/resorts/${nextSiteId}/notifications`) as { notifications?: DashboardNotificationSummary };
      setNotifications(normalizeNotifications(data.notifications));
    } catch {
      setNotifications(emptyNotifications);
    }
  }, [operatorFetch]);

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
      setStatus(loadedSites.length > 0 ? "" : "Site not found in the database.");
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

  useEffect(() => {
    if (selectedSite) {
      void loadNotifications(selectedSite.id);
    } else {
      setNotifications(emptyNotifications);
    }
  }, [loadNotifications, selectedSite]);

  useEffect(() => {
    if (activeTab === "content" && selectedSite && planConfig[effectivePlanType(selectedSite)].siteType !== "landing") {
      setActiveTab("structure");
    }
  }, [activeTab, selectedSite]);

  useEffect(() => {
    if (!unsavedChanges.isDirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedChanges.isDirty]);

  async function updateSelectedSite(nextSite: ResortConsoleData) {
    setStatus("Saving site to database...");
    try {
      const data = await operatorFetch(`/api/operator/resorts/${nextSite.id}`, {
        method: "PUT",
        body: JSON.stringify({ resort: resortPayloadFromSite(nextSite) }),
      });
      const savedSite = siteFromResort({
        ...(data.resort as ResortWithMetrics),
        whatsapp_clicks_count: nextSite.whatsappClicksUsed,
      });
      setSites((currentSites) => currentSites.map((site) => (site.id === savedSite.id ? { ...savedSite, services: nextSite.services } : site)));
      setStatus("Site saved to database.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save site.";
      setStatus(message);
      throw new Error(message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <DashboardHeader notificationCount={notifications.total} />
      <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6">
        {authReady && accessToken && selectedSite ? (
          <DashboardUtilityBar
            sites={sites}
            selectedSite={selectedSite}
            selectedSiteId={selectedSite.id}
            notificationCount={notifications.total}
            onSiteChange={(nextSiteId) => runWithUnsavedGuard(() => router.push(`/dashboard/${nextSiteId}`))}
          />
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Sidebar activeTab={activeTab} site={selectedSite} notificationsByTab={notifications.byTab} onTabChange={handleTabChange} />
          <section className="grid min-w-0 gap-6 pb-10">
          {!authReady ? <DashboardMessage text="Checking account session..." /> : null}
          {authReady && !accessToken ? <DashboardMessage text={status} actionHref="/login?next=/dashboard" actionLabel="Sign in" /> : null}
          {authReady && accessToken && !selectedSite ? <DashboardMessage text={status} actionHref="/dashboard" actionLabel="Back to sites" /> : null}
          {authReady && accessToken && selectedSite ? (
            <>
              {status ? <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">{status}</p> : null}
              {renderTab(activeTab, selectedSite, updateSelectedSite, handleTabChange, accessToken, operatorFetch, setUnsavedChanges, requestConfirmation, () => void loadNotifications(selectedSite.id))}
            </>
          ) : null}
          </section>
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(confirmRequest)}
        options={confirmRequest}
        onCancel={() => setConfirmRequest(null)}
        onConfirm={() => {
          const action = confirmRequest?.onConfirm;
          setConfirmRequest(null);
          action?.();
        }}
      />
    </main>
  );
}

function DashboardUtilityBar({
  sites,
  selectedSite,
  selectedSiteId,
  notificationCount,
  onSiteChange,
}: {
  sites: ResortConsoleData[];
  selectedSite: ResortConsoleData;
  selectedSiteId: string;
  notificationCount: number;
  onSiteChange: (siteId: string) => void;
}) {
  const displayEmail = selectedSite.contactEmail || "operator@travelseed.app";
  const displayName = displayEmail.split("@")[0] || "Operator";
  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "OP";

  return (
    <div className="mb-6 flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="relative min-w-0 md:w-72">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <UtilityIcon name="search" className="h-4 w-4" />
        </span>
        <select
          value={selectedSiteId}
          onChange={(event) => onSiteChange(event.target.value)}
          className="min-h-10 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-0 pl-9 pr-8 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          aria-label="Switch site"
        >
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <UtilityIcon name="chevron" className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
      </div>

      <div className="flex items-center justify-between gap-4 md:justify-end">
        <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Notifications">
          <UtilityIcon name="bell" className="h-4 w-4" />
          {notificationCount > 0 ? <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-bold text-white">{notificationCount > 99 ? "99+" : notificationCount}</span> : null}
        </button>
        <div className="flex items-center gap-3 rounded-lg p-1.5 transition hover:bg-slate-50">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-emerald-600 text-xs font-bold text-white">{initials}</span>
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-44 truncate text-sm font-semibold text-slate-950">{displayName}</span>
            <span className="block max-w-44 truncate text-xs text-slate-500">{displayEmail}</span>
          </span>
          <UtilityIcon name="chevron" className="h-3 w-3 text-slate-400" />
        </div>
      </div>
    </div>
  );
}

function DashboardMessage({ text, actionHref, actionLabel }: { text: string; actionHref?: string; actionLabel?: string }) {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
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

function normalizeNotifications(notifications?: DashboardNotificationSummary): DashboardNotificationSummary {
  if (!notifications) {
    return emptyNotifications;
  }

  const total = Number.isFinite(notifications.total) ? Math.max(0, notifications.total) : 0;
  return {
    total,
    items: Array.isArray(notifications.items) ? notifications.items : [],
    byTab: notifications.byTab ?? {},
  };
}

function UtilityIcon({ name, className }: { name: "bell" | "chevron" | "search"; className: string }) {
  const strokeProps = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "bell":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
    case "chevron":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m6 9 6 6 6-6" /></svg>;
    case "search":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
  }
}
