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
import { SiteSwitcher } from "@/components/dashboard/SiteSwitcher";
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
      <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8">
        <Sidebar activeTab={activeTab} site={selectedSite} notificationsByTab={notifications.byTab} onTabChange={handleTabChange} />
        <section className="grid min-w-0 gap-5 pb-10">
          {!authReady ? <DashboardMessage text="Checking account session..." /> : null}
          {authReady && !accessToken ? <DashboardMessage text={status} actionHref="/login?next=/dashboard" actionLabel="Sign in" /> : null}
          {authReady && accessToken && !selectedSite ? <DashboardMessage text={status} actionHref="/dashboard" actionLabel="Back to sites" /> : null}
          {authReady && accessToken && selectedSite ? (
            <>
              <SiteSwitcher
                sites={sites}
                selectedSiteId={selectedSite.id}
                onSiteChange={(nextSiteId) => runWithUnsavedGuard(() => router.push(`/dashboard/${nextSiteId}`))}
              />
              {status ? <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">{status}</p> : null}
              {renderTab(activeTab, selectedSite, updateSelectedSite, handleTabChange, accessToken, operatorFetch, setUnsavedChanges, requestConfirmation, () => void loadNotifications(selectedSite.id))}
            </>
          ) : null}
        </section>
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
