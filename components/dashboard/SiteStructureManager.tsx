import { Badge, Panel } from "@/components/dashboard/ui";
import { effectivePlanType, forestCustomPages, landingSections, planConfig, treePages } from "@/components/dashboard/subscriptionConfig";
import type { PlanType, ResortConsoleData, SiteStructurePage, SiteStructureSection } from "@/types/dashboard";

const structureCopy = {
  landing: "One focused page with guided sections for direct booking conversion.",
  multipage: "A brand website with dedicated content pages and SEO-ready operations.",
  custom: "A flexible resort platform for premium campaigns and custom navigation.",
};

export function SiteStructureManager({ site }: { site: ResortConsoleData }) {
  const planType = effectivePlanType(site);
  const config = planConfig[planType];
  const isLanding = config.siteType === "landing";
  const pages = planType === "forest" ? forestCustomPages : treePages;

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Site structure</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">{config.structureLabel}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">{config.positioning}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">{config.label}</Badge>
            <Badge tone="sand">{config.siteType}</Badge>
          </div>
        </div>
      </Panel>

      <section className="grid gap-4 lg:grid-cols-3">
        <PlanStructureCard title="Current plan" value={config.label} helper={config.positioning} />
        <PlanStructureCard title="Site type" value={config.structureLabel} helper={structureCopy[config.siteType]} />
        <PlanStructureCard title="Upgrade path" value={config.upgradeTarget ? `Upgrade to ${config.upgradeTarget}` : "Fully unlocked"} helper={config.upgradeTarget ? "Unlock the next site structure tier." : "All site structure controls are available."} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
        {isLanding ? <LandingSectionsView planType={planType} /> : <PagesView planType={planType} pages={pages} />}
        <FeatureAccessPanel planType={planType} />
      </div>
    </div>
  );
}

function LandingSectionsView({ planType }: { planType: PlanType }) {
  const allowSeedFeatures = planType !== "freeTrial";
  const sections = landingSections.map((section) => {
    if (allowSeedFeatures && (section.name === "Reviews" || section.name === "Promotion Banner")) {
      return { ...section, locked: false, lockReason: undefined };
    }
    return section;
  });

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#18352f]">Manage Sections</h2>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Free Trial and Seed sites are managed as one-page landing sections.</p>
        </div>
        <Badge tone="sand">One-page</Badge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {sections.map((section) => (
          <SectionCard key={section.name} section={section} />
        ))}
      </div>
    </Panel>
  );
}

function PagesView({ planType, pages }: { planType: PlanType; pages: SiteStructurePage[] }) {
  const isForest = planType === "forest";

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#18352f]">Manage Pages</h2>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Tree and Forest sites use page-level content, SEO, and publishing controls.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!isForest} className="min-h-10 rounded-full bg-[#18352f] px-4 text-sm font-semibold text-white disabled:bg-[#d8cebb] disabled:text-[#6f7b74]">
            Add Custom Page
          </button>
          <button type="button" disabled={!isForest} className="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb] disabled:text-[#9aa29d]">
            Navigation
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {pages.map((page) => (
          <PageCard key={page.slug} page={page} isForest={isForest} />
        ))}
      </div>
    </Panel>
  );
}

function FeatureAccessPanel({ planType }: { planType: PlanType }) {
  const config = planConfig[planType];

  return (
    <aside className="grid content-start gap-6">
      <Panel>
        <h2 className="text-xl font-semibold text-[#18352f]">Available now</h2>
        <div className="mt-4 grid gap-2">
          {config.unlocked.map((feature) => (
            <FeaturePill key={feature} feature={feature} locked={false} />
          ))}
        </div>
      </Panel>
      <Panel>
        <h2 className="text-xl font-semibold text-[#18352f]">Locked features</h2>
        <div className="mt-4 grid gap-2">
          {config.locked.length > 0 ? config.locked.map((feature) => <FeaturePill key={feature} feature={feature} locked />) : <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm text-[#6f7b74]">Everything is unlocked on Forest.</p>}
        </div>
        {config.upgradeTarget ? (
          <button type="button" className="mt-5 min-h-11 w-full rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
            Upgrade to {config.upgradeTarget}
          </button>
        ) : null}
      </Panel>
    </aside>
  );
}

function PlanStructureCard({ title, value, helper }: { title: string; value: string; helper: string }) {
  return (
    <Panel>
      <p className="text-sm text-[#6f7b74]">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-[#18352f]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#72815e]">{helper}</p>
    </Panel>
  );
}

function SectionCard({ section }: { section: SiteStructureSection }) {
  return (
    <article className={`rounded-2xl border p-4 ${section.locked ? "border-[#eadfce] bg-[#f4f0e7] opacity-75" : "border-[#eadfce] bg-[#fbfaf7]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#18352f]">{section.name}</h3>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">{section.description}</p>
        </div>
        {section.locked ? <Badge tone="gray">Locked</Badge> : <Badge tone="green">Open</Badge>}
      </div>
      <button type="button" disabled={section.locked} className="mt-4 min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb] disabled:text-[#9aa29d]">
        {section.locked ? "Upgrade" : "Edit Section"}
      </button>
      {section.locked && section.lockReason ? <p className="mt-2 text-xs text-[#7b5b24]">{section.lockReason}</p> : null}
    </article>
  );
}

function PageCard({ page, isForest }: { page: SiteStructurePage; isForest: boolean }) {
  const customOnly = ["Wedding", "Tour", "Membership", "Event"].includes(page.pageType);
  const locked = customOnly && !isForest;

  return (
    <article className={`rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4 ${locked ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-[#18352f]">{page.name}</h3>
            <Badge tone={page.isPublished ? "green" : "gray"}>{page.isPublished ? "Published" : "Draft"}</Badge>
          </div>
          <p className="mt-2 text-sm text-[#6f7b74]">{page.slug}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#72815e]">{page.pageType}</p>
        </div>
        {locked ? <Badge tone="sand">Forest</Badge> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <SmallButton disabled={locked}>SEO</SmallButton>
        <SmallButton disabled={locked}>Edit</SmallButton>
        <SmallButton disabled={locked}>Preview</SmallButton>
      </div>
    </article>
  );
}

function FeaturePill({ feature, locked }: { feature: string; locked: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${locked ? "bg-[#f4f0e7] text-[#7b5b24]" : "bg-[#e6f0e7] text-[#1f5a45]"}`}>
      {locked ? "Locked · " : "Open · "}
      {feature}
    </div>
  );
}

function SmallButton({ children, disabled }: { children: string; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#18352f] ring-1 ring-[#d8cebb] disabled:text-[#9aa29d]">
      {children}
    </button>
  );
}
