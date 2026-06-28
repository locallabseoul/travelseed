import { Panel } from "@/components/dashboard/ui";
import type { DashboardTab } from "@/types/dashboard";

const actionTargets: Record<string, DashboardTab> = {
  "Continue Setup": "setup",
  "Edit Home Hero": "content",
  "Update Gallery": "content",
  "Manage Offers": "offers",
  "Edit WhatsApp Inquiry": "whatsapp",
  "Connect Domain": "domain",
  "Upgrade Plan": "plan",
};

export function QuickActionCard({ actions, onTabChange }: { actions: string[]; onTabChange: (tab: DashboardTab) => void }) {
  return (
    <Panel>
      <h2 className="text-lg font-semibold text-slate-950">Quick actions</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onTabChange(actionTargets[action] ?? "dashboard")}
            className="flex min-h-14 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 text-left text-sm font-semibold text-slate-950 transition hover:border-emerald-300 hover:bg-white"
          >
            {action}
            <span className="text-emerald-600">→</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}
