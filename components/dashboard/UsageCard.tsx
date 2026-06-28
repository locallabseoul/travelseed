import type { UsageMetric } from "@/types/dashboard";
import { Panel, ProgressBar } from "@/components/dashboard/ui";

function percent(used: number, limit: number) {
  return Math.round((used / limit) * 100);
}

export function UsageCard({ metrics }: { metrics: UsageMetric[] }) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Usage</h2>
          <p className="mt-1 text-sm text-slate-500">Monthly allowance for the current plan.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">Healthy</span>
      </div>
      <div className="mt-6 grid gap-5">
        {metrics.map((metric) => {
          const usage = percent(metric.used, metric.limit);
          return (
            <div key={metric.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-950">{metric.label}</span>
                <span className="text-slate-500">
                  {metric.used.toLocaleString()}{metric.unit} / {metric.limit.toLocaleString()}{metric.unit}
                </span>
              </div>
              <ProgressBar value={usage} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
