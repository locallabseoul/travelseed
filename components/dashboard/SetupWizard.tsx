import { setupSteps } from "@/components/dashboard/mockData";
import { Badge, Panel, ProgressBar } from "@/components/dashboard/ui";

export function SetupWizard() {
  const doneCount = setupSteps.filter((step) => step.status === "Done").length;
  const progress = Math.round((doneCount / setupSteps.length) * 100);

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Setup</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Launch checklist</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">A guided setup for operators who want a clean direct booking site without editing a complex page builder.</p>
          </div>
          <Badge tone="sand">{progress}% complete</Badge>
        </div>
        <div className="mt-6">
          <ProgressBar value={progress} />
        </div>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        {setupSteps.map((step, index) => (
          <Panel key={step.title}>
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f1eadc] text-sm font-bold text-[#18352f]">{index + 1}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-[#18352f]">{step.title}</h2>
                  <Badge tone={step.status === "Done" ? "green" : step.status === "Current" ? "sand" : "gray"}>{step.status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{step.description}</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
