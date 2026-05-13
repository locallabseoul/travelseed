import type { DashboardMetric } from "@/types/dashboard";
import { Panel } from "@/components/dashboard/ui";

export function StatCard({ metric }: { metric: DashboardMetric }) {
  return (
    <Panel className="min-h-32">
      <p className="text-sm font-medium text-[#6f7b74]">{metric.label}</p>
      <p className="mt-4 text-2xl font-semibold text-[#18352f]">{metric.value}</p>
      <p className="mt-2 text-sm text-[#7a837d]">{metric.helper}</p>
    </Panel>
  );
}
