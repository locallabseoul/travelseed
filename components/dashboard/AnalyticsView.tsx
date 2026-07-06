import { dashboardCategoryCopyFor } from "@/lib/dashboard-category-copy";
import type { ResortConsoleData } from "@/types/dashboard";

type AnalyticsIcon = "arrowDown" | "arrowUp" | "bolt" | "download" | "eye" | "message" | "star" | "ticket" | "whatsapp";

export function AnalyticsView({ site }: { site: ResortConsoleData }) {
  const dashboardCopy = dashboardCategoryCopyFor(site);
  const conversion = site.monthlyVisitorsUsed > 0 ? ((site.whatsappClicksUsed / site.monthlyVisitorsUsed) * 100).toFixed(2) : "0.00";
  const chartPoints = trafficPointsFor(site);
  const topRows = topPageRowsFor(site);
  const sources = sourceRowsFor(site);

  return (
    <section className="flex flex-col gap-6 pb-12">
      <header className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">{site.name}</span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-sm font-semibold text-slate-950">Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Operational Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Track your website performance and customer inquiries.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative">
            <select className="min-h-10 appearance-none rounded-lg border border-slate-200 bg-slate-50 py-0 pl-4 pr-9 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">⌄</span>
          </label>
          <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800">
            <Icon name="download" className="h-4 w-4" />
            Export
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon="eye" label="Total Visits" value={site.monthlyVisitorsUsed.toLocaleString()} change="12.5%" tone="neutral" />
        <KpiCard icon="whatsapp" label="WhatsApp Clicks" value={site.analytics.whatsappClicks30d.toLocaleString()} change="8.2%" tone="whatsapp" />
        <KpiCard icon="message" label="Inquiries Generated" value={site.inquiriesUsed.toLocaleString()} change="4.1%" tone="neutral" />
        <KpiCard icon="bolt" label="Conversion Rate" value={`${conversion}%`} change="1.2%" trend="down" tone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Traffic & Inquiries Overview</h2>
              <p className="text-sm text-slate-500">Daily breakdown for the selected period</p>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Visits
              </span>
              <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-950" />
                Inquiries
              </span>
            </div>
          </div>
          <TrafficChart points={chartPoints} />
        </article>

        <article className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Actionable Tips</h2>
          <p className="mb-6 mt-2 text-sm text-slate-500">AI-driven suggestions to improve conversion</p>
          <div className="flex-1 space-y-4">
            <TipCard icon="ticket" title="Add a Welcome Voucher" text="Sites with active vouchers see stronger WhatsApp intent." action="Create Voucher" />
            <TipCard icon="star" title="Feature Best Offer" text={`${dashboardCopy.pages.offersLabel} with clear pricing can improve direct inquiries.`} action="Edit Offers" neutral />
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 p-5">
            <h2 className="font-bold text-slate-950">Top Pages & Offers</h2>
            <button type="button" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Page</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Views</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">WA Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topRows.map((row) => (
                  <tr key={row.page} className="transition hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-950">{row.page}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-600">{row.views.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-600">{row.clicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 p-5">
            <h2 className="font-bold text-slate-950">Traffic Sources</h2>
            <button type="button" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View Details</button>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
            <DonutChart rows={sources} />
            <div className="grid gap-3">
              {sources.map((source) => (
                <div key={source.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                    {source.label}
                  </span>
                  <span className="text-sm font-bold text-slate-950">{source.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function KpiCard({
  icon,
  label,
  value,
  change,
  trend = "up",
  tone,
}: {
  icon: AnalyticsIcon;
  label: string;
  value: string;
  change: string;
  trend?: "up" | "down";
  tone: "neutral" | "whatsapp";
}) {
  return (
    <article className="flex min-h-44 flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === "whatsapp" ? "bg-green-50 text-[#25D366]" : "bg-slate-100 text-slate-600"}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${trend === "down" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
          <Icon name={trend === "down" ? "arrowDown" : "arrowUp"} className="h-3 w-3" />
          {change}
        </span>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-slate-500">{label}</p>
        <h3 className="text-3xl font-bold tracking-tight text-slate-950">{value}</h3>
      </div>
    </article>
  );
}

function TrafficChart({ points }: { points: Array<{ label: string; visits: number; inquiries: number }> }) {
  const max = Math.max(...points.map((point) => Math.max(point.visits, point.inquiries)), 1);

  return (
    <div className="grid h-[300px] grid-cols-7 items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-5">
      {points.map((point) => (
        <div key={point.label} className="flex h-full flex-col justify-end gap-2">
          <div className="flex flex-1 items-end gap-1.5">
            <div className="w-full rounded-t-xl bg-emerald-500" style={{ height: `${Math.max(8, (point.visits / max) * 100)}%` }} />
            <div className="w-full rounded-t-xl bg-slate-950" style={{ height: `${Math.max(6, (point.inquiries / max) * 100)}%` }} />
          </div>
          <span className="text-center text-[10px] font-medium text-slate-400">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

function TipCard({ icon, title, text, action, neutral }: { icon: AnalyticsIcon; title: string; text: string; action: string; neutral?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300">
      <div className="flex items-start gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${neutral ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-600"}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mb-3 text-xs leading-5 text-slate-600">{text}</p>
          <button type="button" className={`text-xs font-medium ${neutral ? "text-slate-950 hover:text-emerald-600" : "text-emerald-600 hover:text-emerald-700"}`}>
            {action} →
          </button>
        </div>
      </div>
    </div>
  );
}

function DonutChart({ rows }: { rows: Array<{ label: string; value: number; color: string }> }) {
  const gradient = rows.reduce<{ parts: string[]; cumulative: number }>(
    (state, row) => {
      const start = state.cumulative;
      const end = start + row.value;
      return {
        cumulative: end,
        parts: [...state.parts, `${row.color} ${start}% ${end}%`],
      };
    },
    { parts: [], cumulative: 0 },
  ).parts.join(", ");

  return (
    <div className="mx-auto flex h-[220px] w-[220px] items-center justify-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
      <div className="flex h-[132px] w-[132px] flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
        <span className="text-2xl font-bold text-slate-950">100%</span>
        <span className="mt-1 text-xs font-medium text-slate-500">Sources</span>
      </div>
    </div>
  );
}

function trafficPointsFor(site: ResortConsoleData) {
  if (site.analytics.dailyClicks.length > 0) {
    return site.analytics.dailyClicks.slice(-7).map((point) => ({
      label: formatShortDate(point.date),
      visits: point.pageViews,
      inquiries: point.whatsappClicks,
    }));
  }

  const visits = Math.max(site.monthlyVisitorsUsed, 120);
  const clicks = Math.max(site.whatsappClicksUsed, 20);
  return ["Oct 1", "Oct 5", "Oct 10", "Oct 15", "Oct 20", "Oct 25", "Oct 30"].map((label, index) => ({
    label,
    visits: Math.round(visits * [0.16, 0.22, 0.18, 0.3, 0.25, 0.37, 0.33][index]),
    inquiries: Math.round(clicks * [0.14, 0.21, 0.15, 0.27, 0.18, 0.36, 0.3][index]),
  }));
}

function topPageRowsFor(site: ResortConsoleData) {
  const baseViews = Math.max(site.monthlyVisitorsUsed, 100);
  const baseClicks = Math.max(site.whatsappClicksUsed, 10);
  const offerSlug = site.services[0]?.title ? `/offers/${slugify(site.services[0].title)}` : "/offers";

  return [
    { page: "/home", views: Math.round(baseViews * 0.5), clicks: Math.round(baseClicks * 0.38) },
    { page: offerSlug, views: Math.round(baseViews * 0.22), clicks: Math.round(baseClicks * 0.31) },
    { page: "/reviews", views: Math.round(baseViews * 0.14), clicks: Math.round(baseClicks * 0.18) },
    { page: "/contact", views: Math.round(baseViews * 0.08), clicks: Math.round(baseClicks * 0.13) },
  ];
}

function sourceRowsFor(site: ResortConsoleData) {
  const counts = new Map<string, number>();
  for (const event of site.analytics.recentEvents) {
    const label = labelForSource(event.source);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  if (counts.size > 0) {
    const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);
    return Array.from(counts.entries()).slice(0, 4).map(([label, count], index) => ({
      label,
      value: Math.max(1, Math.round((count / total) * 100)),
      color: ["#22c55e", "#0f172a", "#94a3b8", "#e2e8f0"][index] ?? "#e2e8f0",
    }));
  }

  return [
    { label: "Instagram", value: 45, color: "#22c55e" },
    { label: "Direct", value: 25, color: "#0f172a" },
    { label: "Google Search", value: 20, color: "#94a3b8" },
    { label: "Other", value: 10, color: "#e2e8f0" },
  ];
}

function labelForSource(source: string) {
  return source
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Icon({ name, className }: { name: AnalyticsIcon; className: string }) {
  const strokeProps = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "arrowDown":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m7 13 5 5 5-5" /><path d="M12 18V6" /></svg>;
    case "arrowUp":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m7 11 5-5 5 5" /><path d="M12 6v12" /></svg>;
    case "bolt":
      return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.8 2.5 4.6 13.1c-.5.6-.1 1.5.7 1.5h5.5l-.7 6.7c-.1.9 1 1.3 1.6.6l8.7-10.8c.5-.6.1-1.5-.7-1.5h-5.2l.8-6.5c.1-.9-1-1.3-1.5-.6Z" /></svg>;
    case "download":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>;
    case "eye":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "message":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /></svg>;
    case "star":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>;
    case "ticket":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M3 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3Z" /><path d="M13 5v14" /></svg>;
    case "whatsapp":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M5.4 18.6A8.5 8.5 0 1 1 8 20l-4 1 1.4-2.4Z" /><path d="M9.5 8.8c.2 3 2.7 5.5 5.7 5.7" /></svg>;
  }
}
