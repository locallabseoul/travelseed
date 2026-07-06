"use client";

import { effectivePlanType, planConfig } from "@/components/dashboard/subscriptionConfig";
import { BusinessCategoryIcon } from "@/components/business/BusinessCategoryIcon";
import { businessCategoryFromType } from "@/lib/business-categories";
import type { DashboardTab, ResortConsoleData } from "@/types/dashboard";

type SidebarIcon =
  | "analytics"
  | "copy"
  | "domain"
  | "edit"
  | "gear"
  | "globe"
  | "home"
  | "hotel"
  | "import"
  | "inbox"
  | "pages"
  | "palette"
  | "plan"
  | "reviews"
  | "setup"
  | "ticket"
  | "whatsapp";

type SidebarItem = {
  id: DashboardTab;
  label: string;
  icon: SidebarIcon;
  accent?: "whatsapp";
};

const buildItems: SidebarItem[] = [
  { id: "dashboard", label: "Overview", icon: "home" },
  { id: "setup", label: "Setup", icon: "setup" },
  { id: "import", label: "Import", icon: "import" },
  { id: "aiCopy", label: "AI Copy", icon: "copy" },
  { id: "content", label: "Pages", icon: "pages" },
  { id: "structure", label: "Pages", icon: "pages" },
  { id: "offers", label: "Offers/Services", icon: "edit" },
  { id: "design", label: "Design", icon: "palette" },
];

const interactionItems: SidebarItem[] = [
  { id: "whatsapp", label: "WhatsApp", icon: "whatsapp", accent: "whatsapp" },
  { id: "inquiries", label: "Inquiries", icon: "inbox" },
  { id: "vouchers", label: "Vouchers", icon: "ticket" },
  { id: "reviews", label: "Reviews", icon: "reviews" },
];

const systemItems: SidebarItem[] = [
  { id: "domain", label: "Domain", icon: "globe" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "plan", label: "Plan", icon: "plan" },
  { id: "settings", label: "Settings", icon: "gear" },
];

export function Sidebar({
  activeTab,
  site,
  notificationsByTab = {},
  onTabChange,
}: {
  activeTab: DashboardTab;
  site?: ResortConsoleData | null;
  notificationsByTab?: Partial<Record<DashboardTab, number>>;
  onTabChange: (tab: DashboardTab) => void;
}) {
  const isLanding = site ? planConfig[effectivePlanType(site)].siteType === "landing" : true;
  const visibleBuildItems = buildItems.filter((item) => {
    if (item.id === "content") return isLanding;
    if (item.id === "structure") return !isLanding;
    return true;
  });

  return (
    <aside className="hidden flex-col gap-6 lg:flex">
      <SiteContextCard site={site} />
      <nav className="flex-1 space-y-1">
        <MenuGroup items={visibleBuildItems} activeTab={activeTab} notificationsByTab={notificationsByTab} onTabChange={onTabChange} />
        <MenuGroup title="Interactions" items={interactionItems} activeTab={activeTab} notificationsByTab={notificationsByTab} onTabChange={onTabChange} />
        <MenuGroup title="System" items={systemItems} activeTab={activeTab} notificationsByTab={notificationsByTab} onTabChange={onTabChange} />
      </nav>
    </aside>
  );
}

function SiteContextCard({ site }: { site?: ResortConsoleData | null }) {
  const isPublished = site?.status === "Published";
  const category = businessCategoryFromType({ type: site?.type, templateId: site?.template });

  return (
    <section className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <BusinessCategoryIcon
        categoryId={category.id}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-600"
        iconClassName="h-6 w-6"
      />
      <div className="min-w-0">
        <h2 className="truncate text-sm font-bold text-slate-950">{site?.name ?? "Loading site"}</h2>
        <p className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${isPublished ? "text-emerald-600" : "text-slate-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-slate-400"}`} />
          {site?.status ?? "Loading"}
        </p>
      </div>
    </section>
  );
}

function MenuGroup({
  title,
  items,
  activeTab,
  notificationsByTab,
  onTabChange,
}: {
  title?: string;
  items: SidebarItem[];
  activeTab: DashboardTab;
  notificationsByTab: Partial<Record<DashboardTab, number>>;
  onTabChange: (tab: DashboardTab) => void;
}) {
  return (
    <div className={title ? "pt-4" : ""}>
      {title ? <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p> : null}
      <div className="space-y-1">
        {items.map((item) => (
          <MenuButton key={item.id} item={item} active={item.id === activeTab} notificationCount={notificationsByTab[item.id] ?? 0} onClick={() => onTabChange(item.id)} />
        ))}
      </div>
    </div>
  );
}

function MenuButton({
  item,
  active,
  notificationCount,
  onClick,
}: {
  item: SidebarItem;
  active: boolean;
  notificationCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-10 w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon name={item.icon} className={`h-5 w-5 shrink-0 ${item.accent === "whatsapp" && !active ? "text-[#25D366]" : ""}`} />
        <span className="truncate">{item.label}</span>
      </span>
      {notificationCount > 0 ? <MenuNotificationBadge count={notificationCount} active={active} /> : null}
    </button>
  );
}

function MenuNotificationBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span className={`ml-3 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${active ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

function Icon({ name, className }: { name: SidebarIcon; className: string }) {
  const strokeProps = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "analytics":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-3" /></svg>;
    case "copy":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" /><rect x="4" y="9" width="12" height="12" rx="2" /></svg>;
    case "domain":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2" /></svg>;
    case "edit":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>;
    case "gear":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.5-.2-.1a1.7 1.7 0 0 0-2 .1 1.7 1.7 0 0 0-.8 1.7V22H9.2v-.2a1.7 1.7 0 0 0-.8-1.7 1.7 1.7 0 0 0-2-.1l-.2.1-2-3.5.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.5.2.1a1.7 1.7 0 0 0 2-.1A1.7 1.7 0 0 0 9.2 2V2h5.6v.2a1.7 1.7 0 0 0 .8 1.7 1.7 1.7 0 0 0 2 .1l.2-.1 2 3.5-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>;
    case "globe":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 0 20" /><path d="M12 2a15.3 15.3 0 0 0 0 20" /></svg>;
    case "home":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>;
    case "hotel":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M4 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14" /><path d="M16 10h2a2 2 0 0 1 2 2v9" /><path d="M8 9h.01" /><path d="M12 9h.01" /><path d="M9 21v-4h2v4" /></svg>;
    case "import":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>;
    case "inbox":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="m5.5 5 13 0L22 12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7l3.5-7Z" /></svg>;
    case "pages":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></svg>;
    case "palette":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 22a10 10 0 1 1 10-10 3 3 0 0 1-3 3h-1.5a2 2 0 0 0-1.7 3l.2.4A2.4 2.4 0 0 1 13.8 22H12Z" /><path d="M7.5 10.5h.01" /><path d="M10.5 7.5h.01" /><path d="M14.5 7.5h.01" /><path d="M16.5 10.5h.01" /></svg>;
    case "plan":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>;
    case "reviews":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>;
    case "setup":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-3-3 2.4-2.4Z" /></svg>;
    case "ticket":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M3 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3Z" /><path d="M13 5v14" /></svg>;
    case "whatsapp":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M5.4 18.6A8.5 8.5 0 1 1 8 20l-4 1 1.4-2.4Z" /><path d="M9.5 8.8c.2 3 2.7 5.5 5.7 5.7" /></svg>;
  }
}
