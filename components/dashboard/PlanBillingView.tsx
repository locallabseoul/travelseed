import { planOptions } from "@/components/dashboard/mockData";
import { Badge, Panel, PrimaryButton, SecondaryButton } from "@/components/dashboard/ui";
import type { ResortConsoleData } from "@/types/dashboard";

export function PlanBillingView({ site }: { site: ResortConsoleData }) {
  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Plan</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Billing and plan</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{site.plan} is the current plan for {site.name}.</p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-4">
        {planOptions.map((plan) => (
          <Panel key={plan.name} className={plan.name === site.plan ? "ring-2 ring-[#2d6b50]" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#18352f]">{plan.name}</h2>
                <p className="mt-2 text-sm text-[#6f7b74]">{plan.positioning}</p>
              </div>
              {plan.name === site.plan ? <Badge>Current</Badge> : null}
            </div>
            <p className="mt-5 text-2xl font-semibold text-[#18352f]">{plan.price}</p>
            <ul className="mt-5 grid gap-3 text-sm text-[#52615a]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#2d6b50]" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6">{plan.name === site.plan ? <SecondaryButton>Current plan</SecondaryButton> : <PrimaryButton>Select plan</PrimaryButton>}</div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
