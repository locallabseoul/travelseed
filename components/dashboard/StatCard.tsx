import type { DashboardMetric } from "@/types/dashboard";
import { Panel } from "@/components/dashboard/ui";

export function StatCard({ metric }: { metric: DashboardMetric }) {
  return (
    <Panel className="min-h-32">
      <p className="text-sm font-medium text-slate-500">{metric.label}</p>
      <p className="mt-4 text-2xl font-semibold text-slate-950">{metric.value}</p>
      <p className="mt-2 text-sm text-slate-500">{metric.helper}</p>
    </Panel>
  );
}
