import { planOptions } from "@/components/dashboard/mockData";
import { planConfig, planNameToType } from "@/components/dashboard/subscriptionConfig";
import { Badge, Panel, ProgressBar } from "@/components/dashboard/ui";
import type { ResortConsoleData } from "@/types/dashboard";

const planOrder: Array<ResortConsoleData["plan"]> = ["Seed Trial", "Seed", "Tree", "Forest"];

export function PlanBillingView({
  site,
  onSiteUpdate,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
}) {
  const usageRows = [
    {
      label: "Monthly visitors",
      value: site.monthlyVisitorsUsed,
      limit: site.monthlyVisitorsLimit,
      helper: `${site.monthlyVisitorsUsed.toLocaleString()} / ${site.monthlyVisitorsLimit.toLocaleString()}`,
    },
    {
      label: "WhatsApp clicks",
      value: site.whatsappClicksUsed,
      limit: site.whatsappClicksLimit,
      helper: `${site.whatsappClicksUsed.toLocaleString()} / ${site.whatsappClicksLimit.toLocaleString()}`,
    },
    {
      label: "Inquiries",
      value: site.inquiriesUsed,
      limit: site.inquiriesLimit,
      helper: site.inquiriesLimit ? `${site.inquiriesUsed.toLocaleString()} / ${site.inquiriesLimit.toLocaleString()}` : `${site.inquiriesUsed.toLocaleString()} / unlimited`,
    },
    {
      label: "Storage",
      value: site.storageUsedGb,
      limit: site.storageLimitGb,
      helper: `${site.storageUsedGb}GB / ${site.storageLimitGb}GB · ${site.storageImagesUsed} images`,
    },
  ];

  async function selectPlan(plan: ResortConsoleData["plan"]) {
    const planType = planNameToType[plan];
    await onSiteUpdate({ ...site, plan, planType, siteType: planConfig[planType].siteType });
  }

  const downgradeTargets = planOptions.filter((plan) => isDowngrade(site.plan, plan.name));

  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Plan</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Billing and plan</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{site.plan} is the current plan for {site.name}. Site structure expands from landing page to multi-page to custom platform.</p>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#18352f]">Current usage</h2>
            <p className="mt-2 text-sm text-[#6f7b74]">Usage is calculated from this site&apos;s live operational data.</p>
          </div>
          <Badge tone="sand">This month</Badge>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {usageRows.map((row) => (
            <div key={row.label}>
              <div className="mb-2 flex justify-between gap-3 text-sm">
                <span className="font-medium text-[#18352f]">{row.label}</span>
                <span className="text-[#6f7b74]">{row.helper}</span>
              </div>
              <ProgressBar value={row.limit ? (row.value / row.limit) * 100 : 8} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#18352f]">Plan change data policy</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f7b74]">
              Downgrading never deletes your content. Higher-plan pages, navigation, images, SEO, reviews, and custom structures are preserved but locked or hidden until you upgrade again.
            </p>
          </div>
          <Badge tone="green">No content deleted</Badge>
        </div>
        {downgradeTargets.length > 0 ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {downgradeTargets.map((plan) => (
              <DowngradeImpactCard key={plan.name} fromPlan={site.plan} toPlan={plan.name} />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#52615a]">
            You are on the entry plan. Upgrading will unlock more structure without changing your existing content.
          </p>
        )}
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
            <div className="mt-6">
              {isDowngrade(site.plan, plan.name) ? (
                <p className="mb-3 rounded-2xl bg-[#fff7e8] p-3 text-xs leading-5 text-[#7b5b24]">
                  Downgrade impact: content is preserved, but higher-plan features become locked.
                </p>
              ) : null}
              <button
                type="button"
                disabled={plan.name === site.plan}
                onClick={() => void selectPlan(plan.name)}
                className={`min-h-11 rounded-full px-5 text-sm font-semibold ${
                  plan.name === site.plan
                    ? "bg-white text-[#18352f] ring-1 ring-[#d8cebb]"
                    : "bg-[#18352f] text-white"
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {plan.name === site.plan ? "Current plan" : "Select plan"}
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function isDowngrade(currentPlan: ResortConsoleData["plan"], targetPlan: ResortConsoleData["plan"]) {
  return planOrder.indexOf(targetPlan) < planOrder.indexOf(currentPlan);
}

function DowngradeImpactCard({ fromPlan, toPlan }: { fromPlan: ResortConsoleData["plan"]; toPlan: ResortConsoleData["plan"] }) {
  const impacts = downgradeImpacts(fromPlan, toPlan);

  return (
    <article className="rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#18352f]">{fromPlan} to {toPlan}</h3>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Locked but preserved</p>
        </div>
        <Badge tone="sand">Downgrade</Badge>
      </div>
      <ul className="mt-4 grid gap-2 text-sm text-[#52615a]">
        {impacts.map((impact) => (
          <li key={impact} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#c9a15a]" />
            <span>{impact}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function downgradeImpacts(fromPlan: ResortConsoleData["plan"], toPlan: ResortConsoleData["plan"]) {
  const fromIndex = planOrder.indexOf(fromPlan);
  const toIndex = planOrder.indexOf(toPlan);
  const impacts = new Set<string>();

  if (fromIndex >= planOrder.indexOf("Forest") && toIndex < planOrder.indexOf("Forest")) {
    impacts.add("Custom pages and navigation builder become locked.");
    impacts.add("Wedding, tour, event, and membership pages stay stored but hidden if not supported.");
  }

  if (fromIndex >= planOrder.indexOf("Tree") && toIndex < planOrder.indexOf("Tree")) {
    impacts.add("Multi-page URLs, page hero images, and page SEO stay stored but are hidden.");
    impacts.add("The public website switches back to one-page landing mode.");
  }

  if (fromIndex >= planOrder.indexOf("Seed") && toIndex < planOrder.indexOf("Seed")) {
    impacts.add("Reviews, promotion banner, custom domain, and branding controls become locked.");
  }

  impacts.add("Nothing is permanently deleted.");

  return Array.from(impacts);
}
