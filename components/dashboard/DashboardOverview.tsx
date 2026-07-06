import { setupReadinessFor } from "@/components/dashboard/setup-readiness";
import { effectivePlanType, planConfig } from "@/components/dashboard/subscriptionConfig";
import { dashboardCategoryCopyFor } from "@/lib/dashboard-category-copy";
import type { DashboardTab, ResortConsoleData } from "@/types/dashboard";

const templateNameById: Record<string, string> = {
  "boutique-villa": "Legacy Hospitality",
  "boutique-resort": "Legacy Hospitality",
  "surf-camp": "Legacy Tour",
  "minimal-stay": "Category Website",
};

type OverviewIcon =
  | "arrow"
  | "chart"
  | "check"
  | "domain"
  | "edit"
  | "eye"
  | "inbox"
  | "link"
  | "offer"
  | "plus"
  | "share"
  | "ticket"
  | "whatsapp";

export function DashboardOverview({ site, onTabChange }: { site: ResortConsoleData; onTabChange: (tab: DashboardTab) => void }) {
  const readiness = setupReadinessFor(site);
  const dashboardCopy = dashboardCategoryCopyFor(site);
  const structure = planConfig[effectivePlanType(site)];
  const completeSteps = readiness.steps.filter((step) => step.status === "Done").length;
  const conversion = site.monthlyVisitorsUsed > 0 ? ((site.whatsappClicksUsed / site.monthlyVisitorsUsed) * 100).toFixed(1) : "0.0";
  const templateName = templateNameById[site.template] ?? site.template;
  const liveUrl = site.customDomain || site.travelseedUrl;

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Today&apos;s activity for {site.name} is summarized below.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={`/${site.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <Icon name="share" className="h-4 w-4" />
            Share Site
          </a>
          <button type="button" onClick={() => onTabChange("setup")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-700">
            <Icon name="edit" className="h-4 w-4" />
            Edit Site
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SetupReadinessCard completeSteps={completeSteps} totalSteps={readiness.steps.length} site={site} onTabChange={onTabChange} />
        <QuickActionsCard onTabChange={onTabChange} />
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-950">Performance Overview</h2>
          <span className="w-fit rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">Last 30 days</span>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiTile label="Total Visits" value={site.monthlyVisitorsUsed.toLocaleString()} change="30d" tone="green" />
          <KpiTile label="WhatsApp Clicks" value={site.whatsappClicksUsed.toLocaleString()} change="Direct intent" tone="green" />
          <KpiTile label="CTA Conversion" value={`${conversion}%`} change="Clicks / visits" tone="gray" />
        </div>

        <div className="grid h-[300px] grid-cols-7 items-end gap-2 rounded-xl border border-slate-100 bg-slate-50 p-5">
          {chartBarsFor(site).map((bar) => (
            <div key={bar.label} className="flex h-full flex-col justify-end gap-2">
              <div className="flex flex-1 items-end gap-1">
                <div className="w-full rounded-t-lg bg-emerald-500/80" style={{ height: `${bar.views}%` }} />
                <div className="w-full rounded-t-lg bg-slate-300" style={{ height: `${bar.clicks}%` }} />
              </div>
              <span className="text-center text-[10px] font-medium text-slate-400">{bar.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Visits</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300" /> WhatsApp clicks</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentInquiriesCard site={site} onTabChange={onTabChange} />
        <div className="flex flex-col gap-6">
          <VoucherSummaryCard site={site} onTabChange={onTabChange} />
          <LiveStatusCard site={site} liveUrl={liveUrl} templateName={templateName} structureLabel={structure.structureLabel} contentFocus={dashboardCopy.setup.contentFocus} onTabChange={onTabChange} />
        </div>
      </section>
    </div>
  );
}

function SetupReadinessCard({
  completeSteps,
  totalSteps,
  site,
  onTabChange,
}: {
  completeSteps: number;
  totalSteps: number;
  site: ResortConsoleData;
  onTabChange: (tab: DashboardTab) => void;
}) {
  const readiness = setupReadinessFor(site);
  const highlightedStep = readiness.nextStep ?? readiness.steps[readiness.steps.length - 1];

  return (
    <article className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-950">Setup Readiness</h2>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{completeSteps}/{totalSteps} Complete</span>
      </div>

      <div className="flex-1 space-y-4">
        {readiness.steps.slice(0, 4).map((step) => (
          <button key={step.id} type="button" onClick={() => onTabChange(step.targetTab)} className="flex w-full items-start gap-3 text-left">
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${step.status === "Done" ? "bg-emerald-500 text-white" : "border-2 border-slate-300 bg-white text-transparent"}`}>
              <Icon name="check" className="h-3 w-3" />
            </span>
            <span className={`text-sm font-medium ${step.status === "Done" ? "text-slate-500 line-through" : "text-slate-950"}`}>{step.title}</span>
          </button>
        ))}

        <button type="button" onClick={() => onTabChange(highlightedStep.targetTab)} className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left">
          <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-slate-300" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-950">{highlightedStep.title}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">{highlightedStep.missing[0] ? `Review ${highlightedStep.missing[0]}.` : highlightedStep.description}</span>
            <span className="mt-2 inline-flex text-xs font-medium text-emerald-600">Open now →</span>
          </span>
        </button>
      </div>
    </article>
  );
}

function QuickActionsCard({ onTabChange }: { onTabChange: (tab: DashboardTab) => void }) {
  const actions: Array<{ label: string; icon: OverviewIcon; tab: DashboardTab; highlight?: boolean }> = [
    { label: "Edit Homepage", icon: "edit", tab: "content" },
    { label: "Add Offer", icon: "plus", tab: "offers" },
    { label: "Set WhatsApp", icon: "whatsapp", tab: "whatsapp", highlight: true },
    { label: "Connect Domain", icon: "link", tab: "domain" },
  ];

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
      <h2 className="mb-6 text-base font-semibold text-slate-950">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {actions.map((action) => (
          <button key={action.label} type="button" onClick={() => onTabChange(action.tab)} className="group flex min-h-36 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-emerald-300 hover:bg-white hover:shadow-md">
            <span className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition group-hover:border-emerald-200 group-hover:text-emerald-600">
              <Icon name={action.icon} className="h-5 w-5" />
              {action.highlight ? <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#25D366]" /> : null}
            </span>
            <span className="text-sm font-medium text-slate-800">{action.label}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

function KpiTile({ label, value, change, tone }: { label: string; value: string; change: string; tone: "green" | "gray" }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{change}</span>
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function RecentInquiriesCard({ site, onTabChange }: { site: ResortConsoleData; onTabChange: (tab: DashboardTab) => void }) {
  const hasInquiries = site.inquiriesUsed > 0;

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <Icon name="inbox" className="h-4 w-4 text-emerald-500" />
          Recent Inquiries
        </h2>
        <button type="button" onClick={() => onTabChange("inquiries")} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View all</button>
      </div>

      <div className="space-y-4">
        {hasInquiries ? (
          [0, 1].map((index) => (
            <button key={index} type="button" onClick={() => onTabChange("inquiries")} className="flex w-full items-start gap-4 rounded-xl border border-slate-100 p-4 text-left transition hover:bg-slate-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">{index === 0 ? "G" : "W"}</span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-slate-950">{index === 0 ? "Guest inquiry" : "WhatsApp lead"}</span>
                  <span className="shrink-0 text-xs text-slate-400">{index === 0 ? "Today" : "Recent"}</span>
                </span>
                <span className="block truncate text-sm text-slate-600">{index === 0 ? `Asked about ${site.name}` : "Requested direct booking details"}</span>
                <span className="mt-2 flex gap-2">
                  <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">WhatsApp</span>
                  <span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-slate-600">Inquiry</span>
                </span>
              </span>
            </button>
          ))
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm leading-6 text-slate-500">No inquiries yet. Keep your WhatsApp CTA visible and share the live site when ready.</div>
        )}
      </div>
    </article>
  );
}

function VoucherSummaryCard({ site, onTabChange }: { site: ResortConsoleData; onTabChange: (tab: DashboardTab) => void }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <Icon name="ticket" className="h-4 w-4 text-emerald-500" />
          Active Vouchers
        </h2>
        <button type="button" onClick={() => onTabChange("vouchers")} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200">
          <Icon name="plus" className="h-3.5 w-3.5" />
        </button>
      </div>

      <button type="button" onClick={() => onTabChange("vouchers")} className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-left">
        <span>
          <span className="block text-sm font-semibold text-slate-950">{site.services.length > 0 ? `${site.services.length} offer-ready vouchers` : "No vouchers yet"}</span>
          <span className="mt-1 block text-xs text-slate-500">{site.services.length > 0 ? "Create booking confirmations from your offers." : "Create confirmations once inquiries start converting."}</span>
        </span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-700">{site.services.length > 0 ? "Ready" : "Draft"}</span>
      </button>
    </article>
  );
}

function LiveStatusCard({
  site,
  liveUrl,
  templateName,
  structureLabel,
  contentFocus,
  onTabChange,
}: {
  site: ResortConsoleData;
  liveUrl: string;
  templateName: string;
  structureLabel: string;
  contentFocus: string;
  onTabChange: (tab: DashboardTab) => void;
}) {
  return (
    <article className="relative overflow-hidden rounded-[24px] bg-slate-950 p-6 text-white shadow-sm">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500 opacity-20 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${site.isActive ? "bg-emerald-500" : "bg-amber-400"}`} />
          <h2 className="text-sm font-semibold text-white">Live Status</h2>
        </div>
        <p className="break-all text-2xl font-bold">{liveUrl}</p>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          {site.isActive ? `Your ${contentFocus} site is published and visible to the public.` : "Your site is paused. Publish it when the content is ready."}
        </p>
        <div className="mt-5 grid gap-2 rounded-xl bg-white/10 p-3 text-sm text-white/80">
          <div className="flex justify-between gap-3"><span>Structure</span><span className="text-right font-semibold text-white">{structureLabel}</span></div>
          <div className="flex justify-between gap-3"><span>Template</span><span className="text-right font-semibold text-white">{templateName}</span></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => onTabChange("domain")} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/20">Manage Domain</button>
          <a href={`/${site.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/20">
            View Live
            <Icon name="arrow" className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

function chartBarsFor(site: ResortConsoleData) {
  const baseViews = Math.max(site.monthlyVisitorsUsed, 1);
  const baseClicks = Math.max(site.whatsappClicksUsed, 1);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return labels.map((label, index) => {
    const viewRatio = [0.46, 0.62, 0.54, 0.74, 0.68, 0.88, 1][index];
    const clickRatio = [0.28, 0.36, 0.31, 0.48, 0.42, 0.56, 0.62][index];
    return {
      label,
      views: Math.max(12, Math.min(100, Math.round((baseViews / Math.max(baseViews, 100)) * 70 * viewRatio + 20))),
      clicks: Math.max(8, Math.min(85, Math.round((baseClicks / Math.max(baseClicks, 20)) * 55 * clickRatio + 12))),
    };
  });
}

function Icon({ name, className }: { name: OverviewIcon; className: string }) {
  const strokeProps = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "arrow":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>;
    case "chart":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M3 3v18h18" /><path d="m7 14 3-3 3 2 5-6" /></svg>;
    case "check":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M20 6 9 17l-5-5" /></svg>;
    case "domain":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 0 20" /><path d="M12 2a15.3 15.3 0 0 0 0 20" /></svg>;
    case "edit":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>;
    case "eye":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "inbox":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="m5.5 5 13 0L22 12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7l3.5-7Z" /></svg>;
    case "link":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" /></svg>;
    case "offer":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M20.6 13.1 13 20.7a2 2 0 0 1-2.8 0L3.3 13.8a2 2 0 0 1-.6-1.4V5a2 2 0 0 1 2-2h7.4a2 2 0 0 1 1.4.6l7.1 7.1a2 2 0 0 1 0 2.8Z" /><path d="M7.5 7.5h.01" /></svg>;
    case "plus":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
    case "share":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4" /><path d="m15.4 6.5-6.8 4" /></svg>;
    case "ticket":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M3 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3Z" /><path d="M13 5v14" /></svg>;
    case "whatsapp":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M5.4 18.6A8.5 8.5 0 1 1 8 20l-4 1 1.4-2.4Z" /><path d="M9.5 8.8c.2 3 2.7 5.5 5.7 5.7" /></svg>;
  }
}
