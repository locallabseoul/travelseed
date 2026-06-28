import { dashboardMetricsFor, quickActions, recentActivity, usageMetricsFor } from "@/components/dashboard/mockData";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { setupReadinessFor } from "@/components/dashboard/setup-readiness";
import { StatCard } from "@/components/dashboard/StatCard";
import { UsageCard } from "@/components/dashboard/UsageCard";
import { Badge, Panel, ProgressBar } from "@/components/dashboard/ui";
import { effectivePlanType, planConfig } from "@/components/dashboard/subscriptionConfig";
import type { DashboardTab, ResortConsoleData } from "@/types/dashboard";

const templateNameById: Record<string, string> = {
  "boutique-villa": "Boutique Villa",
  "surf-camp": "Surf Camp",
  "minimal-stay": "Local Business",
};

export function DashboardOverview({ site, onTabChange }: { site: ResortConsoleData; onTabChange: (tab: DashboardTab) => void }) {
  const dashboardMetrics = dashboardMetricsFor(site);
  const usageMetrics = usageMetricsFor(site);
  const structure = planConfig[effectivePlanType(site)];
  const readiness = setupReadinessFor(site);
  const templateName = templateNameById[site.template] ?? site.template;

  return (
    <div className="grid gap-6">
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge>{site.status}</Badge>
                <Badge tone="sand">{site.plan}</Badge>
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">Welcome back, {site.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Manage your business website, pages, offers, WhatsApp inquiries, domain, and growth signals from one focused operations console.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-900">{site.travelseedUrl}</span>
                <span className="text-slate-500">{site.customDomain || "Custom domain not connected"}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:pt-8">
              <a href={`/${site.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm">
                View Site
              </a>
              <button type="button" onClick={() => onTabChange("setup")} className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
                Continue Setup
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950 p-4 text-white">
            <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_260px] xl:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Launch readiness</p>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-3xl font-semibold">{readiness.progress}%</p>
                  <Badge tone={readiness.progress === 100 ? "green" : "sand"}>{readiness.nextStep?.title ?? "Ready to promote"}</Badge>
                </div>
                <div className="mt-4">
                  <ProgressBar value={readiness.progress} />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {readiness.steps.map((step) => (
                  <div key={step.id} className="rounded-md bg-white/10 px-4 py-3 text-sm">
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className={step.status === "Done" ? "mt-1 text-xs font-semibold text-[#d8f0dc]" : "mt-1 text-xs font-semibold text-[#f1e4c9]"}>{step.status === "Done" ? "Ready" : "Needs review"}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 rounded-md bg-white/10 p-3 text-sm text-white/78">
                <div className="flex justify-between gap-3">
                  <span>Structure</span>
                  <span className="text-right font-semibold text-white">{structure.structureLabel}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Template</span>
                  <span className="text-right font-semibold text-white">{templateName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Status</span>
                  <span className="text-right font-semibold text-white">{site.isActive ? "Published" : "Paused"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <StatCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <UsageCard metrics={usageMetrics} />
        <QuickActionCard actions={quickActions} onTabChange={onTabChange} />
      </div>

      <Panel>
        <h2 className="text-lg font-semibold text-slate-950">Recent activity</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {recentActivity.map((activity, index) => (
            <div key={activity} className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-slate-950">{activity}</p>
              <p className="mt-1 text-xs text-slate-500">{index + 1} day{index === 0 ? "" : "s"} ago</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
