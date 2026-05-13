import { Panel, ProgressBar } from "@/components/dashboard/ui";
import type { ResortConsoleData } from "@/types/dashboard";

export function AnalyticsView({ site }: { site: ResortConsoleData }) {
  const conversion = site.monthlyVisitorsUsed > 0 ? ((site.whatsappClicksUsed / site.monthlyVisitorsUsed) * 100).toFixed(1) : "0.0";
  const maxDailyActivity = Math.max(...site.analytics.dailyClicks.map((point) => Math.max(point.whatsappClicks, point.pageViews)), 1);
  const sourceCounts = sourceCountsFor(site);

  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Direct booking signal</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Simple performance indicators for non-technical operators.</p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Page Views", site.monthlyVisitorsUsed.toLocaleString()],
          ["WhatsApp Clicks", site.analytics.whatsappClicks30d.toLocaleString()],
          ["Last 7 Days", site.analytics.whatsappClicks7d.toLocaleString()],
          ["CTA Conversion", `${conversion}%`],
        ].map(([label, value]) => (
          <Panel key={label}>
            <p className="text-sm text-[#6f7b74]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#18352f]">{value}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Traffic and clicks by day</h2>
          <div className="mt-6 grid gap-5">
            {site.analytics.dailyClicks.length > 0 ? (
              site.analytics.dailyClicks.map((point) => (
                <div key={point.date}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-[#18352f]">{formatShortDate(point.date)}</span>
                    <span className="text-[#6f7b74]">{point.pageViews} views · {point.whatsappClicks} clicks</span>
                  </div>
                  <ProgressBar value={(Math.max(point.whatsappClicks, point.pageViews) / maxDailyActivity) * 100} />
                </div>
              ))
            ) : (
              <EmptyState text="No WhatsApp clicks recorded in the last 30 days." />
            )}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Recent click events</h2>
          <div className="mt-5 grid gap-3">
            {site.analytics.recentEvents.length > 0 ? (
              site.analytics.recentEvents.map((event) => (
                <div key={`${event.createdAt}-${event.source}`} className="rounded-2xl bg-[#fbfaf7] p-4">
                  <p className="text-sm font-semibold text-[#18352f]">{labelForEvent(event.eventType)} from {labelForSource(event.source)}</p>
                  <p className="mt-1 text-xs text-[#6f7b74]">{formatDateTime(event.createdAt)}</p>
                </div>
              ))
            ) : (
              <EmptyState text="No recent click events yet." />
            )}
          </div>
        </Panel>
      </div>

      <Panel>
        <h2 className="text-xl font-semibold text-[#18352f]">CTA sources</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {sourceCounts.length > 0 ? (
            sourceCounts.map((source) => (
              <div key={source.label} className="rounded-2xl bg-[#fbfaf7] p-4">
                <p className="text-sm font-semibold text-[#18352f]">{source.label}</p>
                <p className="mt-3 text-3xl font-semibold text-[#18352f]">{source.value}</p>
              </div>
            ))
          ) : (
            <EmptyState text="CTA source data will appear after guests click booking buttons." />
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
  return <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#6f7b74]">{text}</p>;
}
