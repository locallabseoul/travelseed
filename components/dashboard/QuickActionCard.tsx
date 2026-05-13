import { Panel } from "@/components/dashboard/ui";

export function QuickActionCard({ actions }: { actions: string[] }) {
  return (
    <Panel>
      <h2 className="text-lg font-semibold text-[#18352f]">Quick actions</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action}
            type="button"
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
