"use client";

import { useState } from "react";
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
import { mockSites } from "@/components/dashboard/mockData";
import type { DashboardTab, ResortConsoleData } from "@/types/dashboard";

function renderTab(activeTab: DashboardTab, selectedSite: ResortConsoleData, onSiteUpdate: (site: ResortConsoleData) => void) {
  switch (activeTab) {
    case "setup":
      return <SetupWizard />;
    case "content":
      return <ContentManager site={selectedSite} onSiteUpdate={onSiteUpdate} />;
    case "design":
      return <DesignManager site={selectedSite} />;
    case "whatsapp":
      return <WhatsAppManager site={selectedSite} onSiteUpdate={onSiteUpdate} />;
    case "domain":
      return <DomainManager site={selectedSite} />;
    case "analytics":
      return <AnalyticsView site={selectedSite} />;
    case "plan":
      return <PlanBillingView site={selectedSite} />;
    case "settings":
      return <SettingsView site={selectedSite} onSiteUpdate={onSiteUpdate} />;
    case "dashboard":
    default:
      return <DashboardOverview site={selectedSite} />;
  }
}

export function DashboardShell() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [sites, setSites] = useState<ResortConsoleData[]>(mockSites);
  const [selectedSiteId, setSelectedSiteId] = useState(mockSites[0].id);
  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? sites[0];

  function updateSelectedSite(nextSite: ResortConsoleData) {
    setSites((currentSites) => currentSites.map((site) => (site.id === nextSite.id ? nextSite : site)));
  }

  // TODO: Replace mock data and local tab state with Supabase-backed site state once customer ownership is finalized.
  return (
    <main className="min-h-screen bg-[#f8f5ef] text-[#18352f]">
      <DashboardHeader />
      <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <section className="grid min-w-0 gap-5 pb-10">
          <SiteSwitcher sites={sites} selectedSiteId={selectedSite.id} onSiteChange={setSelectedSiteId} />
          {renderTab(activeTab, selectedSite, updateSelectedSite)}
        </section>
      </div>
    </main>
  );
}
