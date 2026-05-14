"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Panel } from "@/components/dashboard/ui";
import { effectivePlanType, forestCustomPages, landingSections, planConfig, treePages } from "@/components/dashboard/subscriptionConfig";
import type { PlanType, ResortConsoleData, SiteStructurePage, SiteStructureSection } from "@/types/dashboard";

type StructureResponse = {
  sections?: RawSection[];
  pages?: RawPage[];
};

type RawSection = {
  section_key: string;
  label: string;
  is_enabled: boolean;
  is_locked: boolean;
  sort_order: number;
};

type RawPage = {
  title: string;
  slug: string;
  page_type: SiteStructurePage["pageType"];
  is_published: boolean;
  sort_order: number;
};

const structureCopy = {
  landing: "One focused page with guided sections for direct booking conversion.",
  multipage: "A brand website with dedicated content pages and SEO-ready operations.",
  custom: "A flexible resort platform for premium campaigns and custom navigation.",
};

export function SiteStructureManager({
  site,
  operatorFetch,
}: {
  site: ResortConsoleData;
  operatorFetch: (path: string, init?: RequestInit) => Promise<unknown>;
}) {
  const planType = effectivePlanType(site);
  const config = planConfig[planType];
  const isLanding = config.siteType === "landing";
  const defaultPages = useMemo(() => (planType === "forest" ? forestCustomPages : treePages), [planType]);
  const defaultSections = useMemo(() => sectionsForPlan(planType), [planType]);
  const [sections, setSections] = useState<SiteStructureSection[]>(defaultSections);
  const [pages, setPages] = useState<SiteStructurePage[]>(defaultPages);
  const [status, setStatus] = useState("Loading site structure...");

  useEffect(() => {
    setSections(defaultSections);
    setPages(defaultPages);

    async function loadStructure() {
      setStatus("Loading site structure...");
      try {
        const data = await operatorFetch(`/api/operator/resorts/${site.id}/structure`) as StructureResponse;
        setSections(data.sections && data.sections.length > 0 ? data.sections.map(sectionFromApi) : defaultSections);
        setPages(data.pages && data.pages.length > 0 ? data.pages.map(pageFromApi) : defaultPages);
        setStatus(data.sections?.length || data.pages?.length ? "" : "Using default structure. Save once to store it in the database.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Could not load site structure.");
      }
    }

    void loadStructure();
  }, [defaultPages, defaultSections, operatorFetch, site.id]);

  async function saveStructure(nextSections = sections, nextPages = pages) {
    setStatus("Saving site structure...");
    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/structure`, {
        method: "PUT",
        body: JSON.stringify({
          sections: nextSections.map(sectionToApi),
          pages: nextPages.map(pageToApi),
          navigationItems: nextPages
            .filter((page) => page.isPublished)
            .map((page, index) => ({ label: page.name, href: page.slug, sort_order: index, is_enabled: true })),
        }),
      }) as StructureResponse;
      setSections(data.sections && data.sections.length > 0 ? data.sections.map(sectionFromApi) : nextSections);
      setPages(data.pages && data.pages.length > 0 ? data.pages.map(pageFromApi) : nextPages);
      setStatus("Site structure saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save site structure.");
    }
  }

  function toggleSection(section: SiteStructureSection) {
    if (section.locked) {
      return;
    }
    const nextSections = sections.map((item) => (item.name === section.name ? { ...item, isEnabled: !item.isEnabled } : item));
    setSections(nextSections);
    void saveStructure(nextSections, pages);
  }

  function togglePage(page: SiteStructurePage) {
    const nextPages = pages.map((item) => (item.slug === page.slug ? { ...item, isPublished: !item.isPublished } : item));
    setPages(nextPages);
    void saveStructure(sections, nextPages);
  }

  function addCustomPage() {
    const nextIndex = pages.length + 1;
    const nextPages = [
      ...pages,
      {
        name: `Custom Page ${nextIndex}`,
        slug: `/custom-page-${nextIndex}`,
        pageType: "Landing" as const,
        isPublished: false,
      },
    ];
    setPages(nextPages);
    void saveStructure(sections, nextPages);
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Site structure</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">{config.structureLabel}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">{config.positioning}</p>
            {status ? <p className="mt-3 text-sm font-medium text-[#7b5b24]">{status}</p> : null}
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
        {isLanding ? (
          <LandingSectionsView sections={sections} onToggle={toggleSection} />
        ) : (
          <PagesView planType={planType} pages={pages} onToggle={togglePage} onAddCustomPage={addCustomPage} />
        )}
        <FeatureAccessPanel planType={planType} />
      </div>
    </div>
  );
}

function sectionsForPlan(planType: PlanType) {
  const allowSeedFeatures = planType !== "freeTrial";
  return landingSections.map((section) => ({
    ...section,
    isEnabled: !section.locked || allowSeedFeatures,
    locked: allowSeedFeatures && (section.name === "Reviews" || section.name === "Promotion Banner") ? false : section.locked,
    lockReason: allowSeedFeatures && (section.name === "Reviews" || section.name === "Promotion Banner") ? undefined : section.lockReason,
  }));
}

function LandingSectionsView({ sections, onToggle }: { sections: SiteStructureSection[]; onToggle: (section: SiteStructureSection) => void }) {
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
          <SectionCard key={section.name} section={section} onToggle={() => onToggle(section)} />
        ))}
      </div>
    </Panel>
  );
}

function PagesView({
  planType,
  pages,
  onToggle,
  onAddCustomPage,
}: {
  planType: PlanType;
  pages: SiteStructurePage[];
  onToggle: (page: SiteStructurePage) => void;
  onAddCustomPage: () => void;
}) {
  const isForest = planType === "forest";

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#18352f]">Manage Pages</h2>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Tree and Forest sites use page-level content, SEO, and publishing controls.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onAddCustomPage} disabled={!isForest} className="min-h-10 rounded-full bg-[#18352f] px-4 text-sm font-semibold text-white disabled:bg-[#d8cebb] disabled:text-[#6f7b74]">
            Add Custom Page
          </button>
          <button type="button" disabled={!isForest} className="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb] disabled:text-[#9aa29d]">
            Navigation
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {pages.map((page) => (
          <PageCard key={page.slug} page={page} isForest={isForest} onToggle={() => onToggle(page)} />
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

function SectionCard({ section, onToggle }: { section: SiteStructureSection; onToggle: () => void }) {
  return (
    <article className={`rounded-2xl border p-4 ${section.locked ? "border-[#eadfce] bg-[#f4f0e7] opacity-75" : "border-[#eadfce] bg-[#fbfaf7]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#18352f]">{section.name}</h3>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">{section.description}</p>
        </div>
        {section.locked ? <Badge tone="gray">Locked</Badge> : <Badge tone={section.isEnabled ? "green" : "sand"}>{section.isEnabled ? "On" : "Off"}</Badge>}
      </div>
      <button type="button" onClick={onToggle} disabled={section.locked} className="mt-4 min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb] disabled:text-[#9aa29d]">
        {section.locked ? "Upgrade" : section.isEnabled ? "Disable Section" : "Enable Section"}
      </button>
      {section.locked && section.lockReason ? <p className="mt-2 text-xs text-[#7b5b24]">{section.lockReason}</p> : null}
    </article>
  );
}

function PageCard({ page, isForest, onToggle }: { page: SiteStructurePage; isForest: boolean; onToggle: () => void }) {
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
        <SmallButton disabled={locked} onClick={onToggle}>{page.isPublished ? "Unpublish" : "Publish"}</SmallButton>
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

function SmallButton({ children, disabled, onClick }: { children: string; disabled?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#18352f] ring-1 ring-[#d8cebb] disabled:text-[#9aa29d]">
      {children}
    </button>
  );
}

function sectionFromApi(section: RawSection): SiteStructureSection {
  const fallback = landingSections.find((item) => item.name === section.label || sectionKeyFor(item.name) === section.section_key);

  return {
    name: section.label,
    description: fallback?.description ?? section.section_key,
    isEnabled: section.is_enabled,
    locked: section.is_locked,
    lockReason: fallback?.lockReason,
  };
}

function sectionToApi(section: SiteStructureSection, index: number) {
  return {
    section_key: sectionKeyFor(section.name),
    label: section.name,
    is_enabled: section.isEnabled ?? !section.locked,
    is_locked: section.locked ?? false,
    sort_order: index,
  };
}

function sectionKeyFor(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function pageFromApi(page: RawPage): SiteStructurePage {
  return {
    name: page.title,
    slug: page.slug,
    pageType: page.page_type,
    isPublished: page.is_published,
  };
}

function pageToApi(page: SiteStructurePage, index: number) {
  return {
    title: page.name,
    slug: page.slug,
    page_type: page.pageType,
    is_published: page.isPublished,
    sort_order: index,
  };
}
