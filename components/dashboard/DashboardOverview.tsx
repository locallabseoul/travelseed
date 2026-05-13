import { dashboardMetricsFor, quickActions, recentActivity, usageMetricsFor } from "@/components/dashboard/mockData";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { UsageCard } from "@/components/dashboard/UsageCard";
import { Badge, Panel, PrimaryButton, SecondaryButton } from "@/components/dashboard/ui";
import type { ResortConsoleData } from "@/types/dashboard";

export function DashboardOverview({ site }: { site: ResortConsoleData }) {
  const dashboardMetrics = dashboardMetricsFor(site);
  const usageMetrics = usageMetricsFor(site);

  return (
    <div className="grid gap-6">
      <Panel className="overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.42fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{site.status}</Badge>
              <Badge tone="sand">{site.plan}</Badge>
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#18352f]">Welcome back, {site.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f7b74]">
              Manage your direct booking presence, content, WhatsApp flow, domain, and growth signals from one calm operations console.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-[#f8f5ef] px-4 py-2 font-semibold text-[#18352f]">{site.travelseedUrl}</span>
              <span className="text-[#6f7b74]">{site.customDomain || "Custom domain not connected"}</span>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton>View Site</PrimaryButton>
              <SecondaryButton>Edit Site</SecondaryButton>
            </div>
          </div>
          <div className="rounded-2xl bg-[#18352f] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{site.type}</p>
            <h2 className="mt-3 text-2xl font-semibold">{site.template}</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">{site.location}</p>
            <div className="mt-6 h-32 rounded-2xl bg-gradient-to-br from-[#9eb39f] to-[#eadfce]" />
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
        <QuickActionCard actions={quickActions} />
      </div>

      <Panel>
        <h2 className="text-lg font-semibold text-[#18352f]">Recent activity</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {recentActivity.map((activity, index) => (
            <div key={activity} className="rounded-2xl bg-[#fbfaf7] p-4">
              <p className="text-sm font-semibold text-[#18352f]">{activity}</p>
              <p className="mt-1 text-xs text-[#6f7b74]">{index + 1} day{index === 0 ? "" : "s"} ago</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
