"use client";

import { useMemo } from "react";
import { setupReadinessFor } from "@/components/dashboard/setup-readiness";
import { Badge, Panel, ProgressBar } from "@/components/dashboard/ui";
import type { DashboardTab, ResortConsoleData } from "@/types/dashboard";

export function SetupWizard({
  site,
  onTabChange,
}: {
  site: ResortConsoleData;
  onTabChange: (tab: DashboardTab) => void;
}) {
  const readiness = useMemo(() => setupReadinessFor(site), [site]);

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Setup</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Launch checklist</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Complete each setup step in its dedicated dashboard menu. This page tracks readiness and sends you to the right tool.</p>
          </div>
          <Badge tone={readiness.progress === 100 ? "green" : "sand"}>{readiness.progress}% complete</Badge>
        </div>
        <div className="mt-6">
          <ProgressBar value={readiness.progress} />
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {readiness.steps.map((step, index) => (
          <Panel key={step.id}>
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f1eadc] text-sm font-bold text-[#18352f]">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-[#18352f]">{step.title}</h2>
                  <Badge tone={step.status === "Done" ? "green" : step.status === "Current" ? "sand" : "gray"}>{step.status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{step.description}</p>
                {step.missing.length > 0 ? <p className="mt-3 text-xs font-semibold text-[#7b5b24]">Needs {step.missing.join(", ")}</p> : null}
                <button type="button" onClick={() => onTabChange(step.targetTab)} className="mt-5 min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
                  {step.ctaLabel}
                </button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
