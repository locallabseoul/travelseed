import { Panel } from "@/components/dashboard/ui";
import type { DashboardTab } from "@/types/dashboard";

const actionTargets: Record<string, DashboardTab> = {
  "Edit Hero Section": "content",
  "Update Gallery": "content",
  "Change WhatsApp Number": "whatsapp",
  "Connect Domain": "domain",
  "Upgrade Plan": "plan",
};

export function QuickActionCard({ actions, onTabChange }: { actions: string[]; onTabChange: (tab: DashboardTab) => void }) {
  return (
    <Panel>
      <h2 className="text-lg font-semibold text-[#18352f]">Quick actions</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => onTabChange(actionTargets[action] ?? "dashboard")}
            className="flex min-h-14 items-center justify-between rounded-xl border border-[#eadfce] bg-[#fbfaf7] px-4 text-left text-sm font-semibold text-[#18352f] transition hover:border-[#2d6b50] hover:bg-white"
          >
            {action}
            <span className="text-[#8a7560]">→</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}
