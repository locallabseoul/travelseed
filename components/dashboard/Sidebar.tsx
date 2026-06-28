"use client";

import { effectivePlanType, planConfig } from "@/components/dashboard/subscriptionConfig";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { TranslationKey } from "@/components/i18n/LanguageProvider";
import type { DashboardTab } from "@/types/dashboard";
import type { ResortConsoleData } from "@/types/dashboard";

const menuItems: Array<{ id: DashboardTab; labelKey: TranslationKey; icon: string }> = [
  { id: "dashboard", labelKey: "dashboard.tab.dashboard", icon: "D" },
  { id: "setup", labelKey: "dashboard.tab.setup", icon: "S" },
  { id: "import", labelKey: "dashboard.tab.import", icon: "I" },
  { id: "aiCopy", labelKey: "dashboard.tab.aiCopy", icon: "A" },
  { id: "content", labelKey: "dashboard.tab.content", icon: "C" },
  { id: "offers", labelKey: "dashboard.tab.offers", icon: "O" },
  { id: "structure", labelKey: "dashboard.tab.structure", icon: "P" },
  { id: "design", labelKey: "dashboard.tab.design", icon: "D" },
  { id: "whatsapp", labelKey: "dashboard.tab.whatsapp", icon: "W" },
  { id: "inquiries", labelKey: "dashboard.tab.inquiries", icon: "I" },
  { id: "vouchers", labelKey: "dashboard.tab.vouchers", icon: "V" },
  { id: "domain", labelKey: "dashboard.tab.domain", icon: "D" },
  { id: "analytics", labelKey: "dashboard.tab.analytics", icon: "A" },
  { id: "reviews", labelKey: "dashboard.tab.reviews", icon: "R" },
  { id: "plan", labelKey: "dashboard.tab.plan", icon: "P" },
  { id: "settings", labelKey: "dashboard.tab.settings", icon: "S" },
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
  const { t } = useLanguage();
  const isLanding = site ? planConfig[effectivePlanType(site)].siteType === "landing" : true;
  const visibleMenuItems = isLanding ? menuItems : menuItems.filter((item) => item.id !== "content");

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-48px)] lg:flex-col lg:overflow-hidden">
      <div className="hidden shrink-0 px-3 pb-4 pt-2 lg:block">
        <p className="text-sm font-bold tracking-tight text-slate-950">Travelseed</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{t("dashboard.sidebar.subtitle")}</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-1.5 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain lg:pb-1 lg:pr-1">
        {visibleMenuItems.map((item) => {
          const isActive = item.id === activeTab;
          const notificationCount = notificationsByTab[item.id] ?? 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-semibold transition lg:min-h-10 lg:w-full ${
                isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-md text-xs ${isActive ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>
                {item.icon}
              </span>
              <span className="min-w-0 flex-1 text-left">{t(item.labelKey)}</span>
              {notificationCount > 0 ? <MenuNotificationBadge count={notificationCount} active={isActive} /> : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function MenuNotificationBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span className={`ml-auto inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${active ? "bg-white text-red-700" : "bg-red-700 text-white"}`}>
      N {count > 99 ? "99+" : count}
    </span>
  );
}
