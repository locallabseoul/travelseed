"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalyticsView } from "@/components/dashboard/AnalyticsView";
import { ContentManager } from "@/components/dashboard/ContentManager";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DesignManager } from "@/components/dashboard/DesignManager";
import { DomainManager } from "@/components/dashboard/DomainManager";
import { PlanBillingView } from "@/components/dashboard/PlanBillingView";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { SiteSwitcher } from "@/components/dashboard/SiteSwitcher";
import { SetupWizard } from "@/components/dashboard/SetupWizard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { WhatsAppManager } from "@/components/dashboard/WhatsAppManager";
import { resortPayloadFromSite, siteFromResort } from "@/components/dashboard/data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DashboardTab, ResortConsoleData } from "@/types/dashboard";
import type { ResortWithMetrics } from "@/types/resort";

function renderTab(
  activeTab: DashboardTab,
  selectedSite: ResortConsoleData,
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>,
  onTabChange: (tab: DashboardTab) => void,
  accessToken: string | null,
  operatorFetch: (path: string, init?: RequestInit) => Promise<unknown>,
) {
  switch (activeTab) {
    case "setup":
      return <SetupWizard />;
    case "content":
      return <ContentManager site={selectedSite} accessToken={accessToken} onSiteUpdate={onSiteUpdate} />;
    case "design":
      return <DesignManager site={selectedSite} />;
    case "whatsapp":
      return <WhatsAppManager site={selectedSite} onSiteUpdate={onSiteUpdate} />;
    case "domain":
      return <DomainManager site={selectedSite} onSiteUpdate={onSiteUpdate} operatorFetch={operatorFetch} />;
    case "analytics":
      return <AnalyticsView site={selectedSite} />;
    case "plan":
      return <PlanBillingView site={selectedSite} />;
    case "settings":
      return <SettingsView site={selectedSite} onSiteUpdate={onSiteUpdate} />;
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
  const selectedSite = sites.find((site) => site.id === siteId) ?? null;

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

  async function operatorFetch(path: string, init: RequestInit = {}) {
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
  }

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
      setStatus(error instanceof Error ? error.message : "Could not save site.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef] text-[#18352f]">
      <DashboardHeader />
      <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <section className="grid min-w-0 gap-5 pb-10">
          {!authReady ? <DashboardMessage text="Checking account session..." /> : null}
          {authReady && !accessToken ? <DashboardMessage text={status} actionHref="/login?next=/dashboard" actionLabel="Sign in" /> : null}
          {authReady && accessToken && !selectedSite ? <DashboardMessage text={status} actionHref="/dashboard" actionLabel="Back to sites" /> : null}
          {authReady && accessToken && selectedSite ? (
            <>
              <SiteSwitcher sites={sites} selectedSiteId={selectedSite.id} onSiteChange={(nextSiteId) => router.push(`/dashboard/${nextSiteId}`)} />
              {status ? <p className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6f7b74] shadow-sm">{status}</p> : null}
              {renderTab(activeTab, selectedSite, updateSelectedSite, setActiveTab, accessToken, operatorFetch)}
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function DashboardMessage({ text, actionHref, actionLabel }: { text: string; actionHref?: string; actionLabel?: string }) {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#e8dfd0] bg-white p-6 text-center shadow-[0_18px_60px_rgba(54,43,29,0.07)]">
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
