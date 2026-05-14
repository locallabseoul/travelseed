"use client";

import type { DashboardTab } from "@/types/dashboard";

const menuItems: Array<{ id: DashboardTab; label: string; icon: string }> = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "setup", label: "Setup", icon: "S" },
  { id: "content", label: "Content", icon: "C" },
  { id: "offers", label: "Offers", icon: "O" },
  { id: "design", label: "Design", icon: "D" },
  { id: "whatsapp", label: "WhatsApp", icon: "W" },
  { id: "inquiries", label: "Inquiries", icon: "I" },
  { id: "domain", label: "Domain", icon: "D" },
  { id: "analytics", label: "Analytics", icon: "A" },
  { id: "reviews", label: "Reviews", icon: "R" },
  { id: "plan", label: "Plan", icon: "P" },
  { id: "settings", label: "Settings", icon: "S" },
];

export function Sidebar({ activeTab, onTabChange }: { activeTab: DashboardTab; onTabChange: (tab: DashboardTab) => void }) {
  return (
    <aside className="rounded-2xl border border-[#e8dfd0] bg-white p-3 shadow-[0_18px_60px_rgba(54,43,29,0.07)] lg:sticky lg:top-6 lg:h-[calc(100vh-48px)]">
      <div className="hidden px-3 pb-4 pt-2 lg:block">
        <p className="text-sm font-semibold tracking-[0.22em] text-[#18352f]">TRAVELSEED</p>
        <p className="mt-2 text-xs leading-5 text-[#6f7b74]">Direct booking operations</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
        {menuItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition lg:w-full ${
                isActive ? "bg-[#18352f] text-white shadow-sm" : "text-[#52615a] hover:bg-[#f8f5ef] hover:text-[#18352f]"
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${isActive ? "bg-white/15" : "bg-[#f1eadc]"}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
