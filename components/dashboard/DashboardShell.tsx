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
import { SetupWizard } from "@/components/dashboard/SetupWizard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { WhatsAppManager } from "@/components/dashboard/WhatsAppManager";
import type { DashboardTab } from "@/types/dashboard";

function renderTab(activeTab: DashboardTab) {
  switch (activeTab) {
    case "setup":
      return <SetupWizard />;
    case "content":
      return <ContentManager />;
    case "design":
      return <DesignManager />;
    case "whatsapp":
      return <WhatsAppManager />;
    case "domain":
      return <DomainManager />;
    case "analytics":
      return <AnalyticsView />;
    case "plan":
      return <PlanBillingView />;
    case "settings":
      return <SettingsView />;
    case "dashboard":
    default:
      return <DashboardOverview />;
  }
}

export function DashboardShell() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");

  // TODO: Replace mock data and local tab state with Supabase-backed site state once customer ownership is finalized.
  return (
    <main className="min-h-screen bg-[#f8f5ef] text-[#18352f]">
      <DashboardHeader />
      <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <section className="min-w-0 pb-10">{renderTab(activeTab)}</section>
      </div>
    </main>
  );
}
