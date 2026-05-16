"use client";

import { effectivePlanType, planConfig } from "@/components/dashboard/subscriptionConfig";
import type { DashboardTab } from "@/types/dashboard";
import type { ResortConsoleData } from "@/types/dashboard";

const menuItems: Array<{ id: DashboardTab; label: string; icon: string }> = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "setup", label: "Setup", icon: "S" },
  { id: "import", label: "Import", icon: "I" },
  { id: "aiCopy", label: "AI Copy", icon: "A" },
  { id: "content", label: "Content", icon: "C" },
  { id: "offers", label: "Offers", icon: "O" },
  { id: "structure", label: "Pages", icon: "P" },
  { id: "design", label: "Design", icon: "D" },
  { id: "whatsapp", label: "WhatsApp", icon: "W" },
  { id: "inquiries", label: "Inquiries", icon: "I" },
  { id: "domain", label: "Domain", icon: "D" },
  { id: "analytics", label: "Analytics", icon: "A" },
  { id: "reviews", label: "Reviews", icon: "R" },
  { id: "plan", label: "Plan", icon: "P" },
  { id: "settings", label: "Settings", icon: "S" },
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
  const visibleMenuItems = isLanding ? menuItems : menuItems.filter((item) => item.id !== "content");

  return (
    <aside className="rounded-2xl border border-[#e8dfd0] bg-white p-3 shadow-[0_18px_60px_rgba(54,43,29,0.07)] lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-48px)] lg:flex-col lg:overflow-hidden">
      <div className="hidden shrink-0 px-3 pb-4 pt-2 lg:block">
        <p className="text-sm font-semibold tracking-[0.22em] text-[#18352f]">TRAVELSEED</p>
        <p className="mt-2 text-xs leading-5 text-[#6f7b74]">Direct booking operations</p>
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
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition lg:min-h-10 lg:w-full ${
                isActive ? "bg-[#18352f] text-white shadow-sm" : "text-[#52615a] hover:bg-[#f8f5ef] hover:text-[#18352f]"
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${isActive ? "bg-white/15" : "bg-[#f1eadc]"}`}>
                {item.icon}
              </span>
              <span className="min-w-0 flex-1 text-left">{item.label}</span>
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
    <span className={`ml-auto inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${active ? "bg-white text-[#b4362a]" : "bg-[#b4362a] text-white"}`}>
      N {count > 99 ? "99+" : count}
    </span>
  );
}
