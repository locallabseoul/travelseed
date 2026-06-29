import { Badge, Panel, ProgressBar } from "@/components/dashboard/ui";
import { dashboardCategoryCopyFor } from "@/lib/dashboard-category-copy";
import type { ResortConsoleData } from "@/types/dashboard";

export function AnalyticsView({ site }: { site: ResortConsoleData }) {
  const dashboardCopy = dashboardCategoryCopyFor(site);
  const conversion = site.monthlyVisitorsUsed > 0 ? ((site.whatsappClicksUsed / site.monthlyVisitorsUsed) * 100).toFixed(1) : "0.0";
  const maxDailyActivity = Math.max(...site.analytics.dailyClicks.map((point) => Math.max(point.whatsappClicks, point.pageViews)), 1);
  const sourceCounts = sourceCountsFor(site);

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Analytics</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Business performance</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Follow the signals that matter for a WhatsApp-first site: visits, customer intent, and inquiry conversion.
            </p>
          </div>
          <Badge tone="green">Last 30 days</Badge>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Page Views", site.monthlyVisitorsUsed.toLocaleString(), "Customers landing on the site"],
          ["WhatsApp Clicks", site.analytics.whatsappClicks30d.toLocaleString(), dashboardCopy.analytics.whatsappHelper],
          ["Customer Inquiries", site.inquiriesUsed.toLocaleString(), dashboardCopy.analytics.inquiriesHelper],
          ["CTA Conversion", `${conversion}%`, dashboardCopy.analytics.conversionHelper],
        ].map(([label, value, helper]) => (
          <Panel key={label}>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{helper}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Traffic and WhatsApp activity</h2>
              <p className="mt-1 text-sm text-slate-500">{dashboardCopy.analytics.chartDescription}</p>
            </div>
            <Badge tone="gray">{site.analytics.dailyClicks.length || 0} days</Badge>
          </div>
          <div className="mt-6 grid gap-5">
            {site.analytics.dailyClicks.length > 0 ? (
              site.analytics.dailyClicks.map((point) => (
                <div key={point.date} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-950">{formatShortDate(point.date)}</span>
                    <span className="text-slate-500">{point.pageViews} views · {point.whatsappClicks} clicks</span>
                  </div>
                  <ProgressBar value={(Math.max(point.whatsappClicks, point.pageViews) / maxDailyActivity) * 100} />
                </div>
              ))
            ) : (
              <EmptyState text="No page view or WhatsApp click events recorded in the last 30 days." />
            )}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold text-slate-950">Recent events</h2>
          <div className="mt-5 grid gap-3">
            {site.analytics.recentEvents.length > 0 ? (
              site.analytics.recentEvents.map((event) => (
                <div key={`${event.createdAt}-${event.source}`} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{labelForEvent(event.eventType)}</p>
                    <Badge tone={event.eventType === "page_view" ? "gray" : "green"}>{labelForSource(event.source)}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
                </div>
              ))
            ) : (
              <EmptyState text="Recent customer activity will appear here after the site receives traffic." />
            )}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">CTA sources</h2>
            <p className="mt-1 text-sm text-slate-500">{dashboardCopy.analytics.ctaSourceDescription}</p>
          </div>
          <Badge tone="gray">{sourceCounts.length} sources</Badge>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {sourceCounts.length > 0 ? (
            sourceCounts.map((source) => (
              <div key={source.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">{source.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{source.value}</p>
              </div>
            ))
          ) : (
            <EmptyState text="CTA source data will appear after customers click WhatsApp buttons." />
          )}
        </div>
      </Panel>
    </div>
  );
}

function sourceCountsFor(site: ResortConsoleData) {
  const counts = new Map<string, number>();
  for (const event of site.analytics.recentEvents) {
    const label = labelForSource(event.source);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

function labelForSource(source: string) {
  return source
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function labelForEvent(eventType: string) {
  return eventType === "page_view" ? "Page viewed" : "WhatsApp clicked";
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">{text}</p>;
}
