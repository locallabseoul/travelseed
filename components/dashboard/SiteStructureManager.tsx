"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentManager } from "@/components/dashboard/ContentManager";
import { Badge, Panel } from "@/components/dashboard/ui";
import { effectivePlanType, forestCustomPages, landingSections, planConfig, treePages } from "@/components/dashboard/subscriptionConfig";
import { presetForSlug, presetSettingsFrom } from "@/lib/section-presets";
import type { DashboardConfirmOptions, DashboardTab, DashboardUnsavedChanges, PlanType, ResortConsoleData, SitePageSettings, SiteStructurePage, SiteStructureSection } from "@/types/dashboard";

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
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  settings?: SitePageSettings;
};

const structureCopy = {
  landing: "One focused page with guided sections for direct booking conversion.",
  multipage: "A brand website with dedicated content pages and SEO-ready operations.",
  custom: "A flexible resort platform for premium campaigns and custom navigation.",
};

export function SiteStructureManager({
  site,
  accessToken,
  operatorFetch,
  onSiteUpdate,
  onTabChange,
  onUnsavedChangesChange,
  requestConfirmation,
}: {
  site: ResortConsoleData;
  accessToken: string | null;
  operatorFetch: (path: string, init?: RequestInit) => Promise<unknown>;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  onTabChange: (tab: DashboardTab) => void;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
  requestConfirmation?: (options: DashboardConfirmOptions, onConfirm: () => void) => void;
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
        setSections(data.sections && data.sections.length > 0 ? mergeSectionsWithDefaults(data.sections.map(sectionFromApi), defaultSections) : defaultSections);
        setPages(data.pages && data.pages.length > 0 ? mergePagesWithDefaults(data.pages.map(pageFromApi), defaultPages) : defaultPages);
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
    const applyToggle = () => {
      const nextPages = pages.map((item) => (item.slug === page.slug ? { ...item, isPublished: !item.isPublished } : item));
      setPages(nextPages);
      void saveStructure(sections, nextPages);
    };

    if (requestConfirmation) {
      requestConfirmation({
      title: page.isPublished ? `Unpublish ${page.name}?` : `Publish ${page.name}?`,
      description: page.isPublished
        ? "This page will be hidden from the public website, but its content and settings will remain saved."
        : "This page will become available on the public website.",
      confirmLabel: page.isPublished ? "Unpublish page" : "Publish page",
      cancelLabel: "Cancel",
      tone: page.isPublished ? "danger" : "default",
      }, applyToggle);
      return;
    }

    applyToggle();
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

      <div className="grid gap-6">
        {isLanding ? (
          <LandingSectionsView sections={sections} onToggle={toggleSection} />
        ) : (
          <PagesView
            site={site}
            accessToken={accessToken}
            planType={planType}
            pages={pages}
            onSiteUpdate={onSiteUpdate}
            onToggle={togglePage}
            onAddCustomPage={addCustomPage}
            onTabChange={onTabChange}
            onUnsavedChangesChange={onUnsavedChangesChange}
            onPagesChange={(nextPages) => {
              setPages(nextPages);
              void saveStructure(sections, nextPages);
            }}
          />
        )}
        <FeatureAccessDisclosure planType={planType} />
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

function mergeSectionsWithDefaults(savedSections: SiteStructureSection[], defaultSections: SiteStructureSection[]) {
  const savedByName = new Map(savedSections.map((section) => [section.name, section]));
  const defaultSectionNames = new Set(defaultSections.map((section) => section.name));
  const mergedDefaults = defaultSections.map((section) => ({ ...section, ...savedByName.get(section.name) }));
  const customSections = savedSections.filter((section) => !defaultSectionNames.has(section.name));

  return [...mergedDefaults, ...customSections];
}

function mergePagesWithDefaults(savedPages: SiteStructurePage[], defaultPages: SiteStructurePage[]) {
  const savedBySlug = new Map(savedPages.map((page) => [page.slug, page]));
  const defaultPageSlugs = new Set(defaultPages.map((page) => page.slug));
  const mergedDefaults = defaultPages.map((page) => ({ ...page, ...savedBySlug.get(page.slug) }));
  const customPages = savedPages.filter((page) => !defaultPageSlugs.has(page.slug));

  return [...mergedDefaults, ...customPages];
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
  site,
  accessToken,
  planType,
  pages,
  onSiteUpdate,
  onToggle,
  onAddCustomPage,
  onTabChange,
  onUnsavedChangesChange,
  onPagesChange,
}: {
  site: ResortConsoleData;
  accessToken: string | null;
  planType: PlanType;
  pages: SiteStructurePage[];
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  onToggle: (page: SiteStructurePage) => void;
  onAddCustomPage: () => void;
  onTabChange: (tab: DashboardTab) => void;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
  onPagesChange: (pages: SiteStructurePage[]) => void;
}) {
  const isForest = planType === "forest";
  const [selectedSlug, setSelectedSlug] = useState(pages[0]?.slug ?? "/");
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showNavigation, setShowNavigation] = useState(false);
  const selectedPage = pages.find((page) => page.slug === selectedSlug) ?? pages[0];

  useEffect(() => {
    if (!pages.some((page) => page.slug === selectedSlug)) {
      setSelectedSlug(pages[0]?.slug ?? "/");
    }
  }, [pages, selectedSlug]);

  async function uploadPageHero(page: SiteStructurePage, file: File) {
    if (isHomePage(page)) {
      setUploadStatus("Home hero image is managed in Page content > Hero.");
      return;
    }

    if (!accessToken) {
      setUploadStatus("Sign in before uploading page images.");
      return;
    }

    setUploadingSlug(page.slug);
    setUploadStatus(`Uploading ${page.name} hero image...`);

    try {
      const formData = new FormData();
      formData.set("file", file, file.name);
      formData.set("folder", "page-hero");
      formData.set("slug", site.slug);

      const response = await fetch("/api/operator/images", {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? "Page hero upload failed.");
      }

      const publicUrl = String(data.publicUrl);
      const nextPages = pages.map((item) => (item.slug === page.slug ? { ...item, heroImageUrl: publicUrl } : item));
      onPagesChange(nextPages);
      setUploadStatus(`${page.name} hero image uploaded and saved.`);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Page hero upload failed.");
    } finally {
      setUploadingSlug(null);
    }
  }

  function updatePageSeo(page: SiteStructurePage, seoTitle: string, seoDescription: string) {
    const nextPages = pages.map((item) => (item.slug === page.slug ? { ...item, seoTitle, seoDescription } : item));
    onPagesChange(nextPages);
  }

  function updatePageSettings(page: SiteStructurePage, settings: SitePageSettings) {
    const nextPages = pages.map((item) => (item.slug === page.slug ? { ...item, settings } : item));
    onPagesChange(nextPages);
  }

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
          <button type="button" onClick={() => setShowNavigation((current) => !current)} disabled={!isForest} className="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb] disabled:text-[#9aa29d]">
            Navigation
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Page submenu" className="flex gap-2 overflow-x-auto rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-2 lg:grid lg:content-start lg:overflow-visible">
          {pages.map((page) => {
            const isSelected = page.slug === selectedPage?.slug;
            return (
              <button
                key={page.slug}
                type="button"
                onClick={() => setSelectedSlug(page.slug)}
                className={`flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${
                  isSelected ? "bg-[#18352f] text-white shadow-sm" : "bg-white text-[#52615a] ring-1 ring-[#eadfce] hover:text-[#18352f]"
                }`}
              >
                <span>{page.name}</span>
                <span className={`h-2 w-2 rounded-full ${page.isPublished ? "bg-[#4f9b6b]" : "bg-[#c9b891]"} ${isSelected ? "ring-2 ring-white/30" : ""}`} />
              </button>
            );
          })}
        </nav>
        {selectedPage ? (
          <PageDetail
            site={site}
            page={selectedPage}
            isForest={isForest}
            uploading={uploadingSlug === selectedPage.slug}
            uploadStatus={uploadStatus}
            accessToken={accessToken}
            onSiteUpdate={onSiteUpdate}
            onTabChange={onTabChange}
            onUnsavedChangesChange={onUnsavedChangesChange}
            onUpload={(file) => uploadPageHero(selectedPage, file)}
            onSaveSeo={(seoTitle, seoDescription) => updatePageSeo(selectedPage, seoTitle, seoDescription)}
            onSaveSettings={(settings) => updatePageSettings(selectedPage, settings)}
            onToggle={() => onToggle(selectedPage)}
          />
        ) : null}
      </div>
      {showNavigation && isForest ? <NavigationPreview site={site} pages={pages} /> : null}
    </Panel>
  );
}

function FeatureAccessDisclosure({ planType }: { planType: PlanType }) {
  const config = planConfig[planType];
  const [expanded, setExpanded] = useState(false);

  return (
    <Panel className="bg-[#fbfaf7] shadow-none">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#18352f]">Plan feature access</p>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">
            {config.unlocked.length} available now · {config.locked.length > 0 ? `${config.locked.length} locked on ${config.label}` : "Everything unlocked"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="green">{config.label}</Badge>
          <button type="button" onClick={() => setExpanded((current) => !current)} className="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
            {expanded ? "Hide features" : "View plan features"}
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadfce]">
            <h3 className="text-sm font-semibold text-[#18352f]">Available now</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {config.unlocked.map((feature) => (
                <FeaturePill key={feature} feature={feature} locked={false} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadfce]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-[#18352f]">Locked features</h3>
              {config.upgradeTarget ? (
                <button type="button" className="min-h-9 rounded-full bg-[#18352f] px-4 text-xs font-semibold text-white">
                  Upgrade to {config.upgradeTarget}
                </button>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {config.locked.length > 0 ? config.locked.map((feature) => <FeaturePill key={feature} feature={feature} locked />) : <p className="rounded-2xl bg-[#fbfaf7] px-4 py-3 text-sm text-[#6f7b74]">Everything is unlocked on Forest.</p>}
            </div>
          </div>
        </div>
      ) : null}
    </Panel>
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

function PageDetail({
  site,
  page,
  isForest,
  uploading,
  uploadStatus,
  accessToken,
  onSiteUpdate,
  onTabChange,
  onUnsavedChangesChange,
  onUpload,
  onSaveSeo,
  onSaveSettings,
  onToggle,
}: {
  site: ResortConsoleData;
  page: SiteStructurePage;
  isForest: boolean;
  uploading: boolean;
  uploadStatus: string;
  accessToken: string | null;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  onTabChange: (tab: DashboardTab) => void;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
  onUpload: (file: File) => void;
  onSaveSeo: (seoTitle: string, seoDescription: string) => void;
  onSaveSettings: (settings: SitePageSettings) => void;
  onToggle: () => void;
}) {
  const customOnly = ["Wedding", "Tour", "Membership", "Event"].includes(page.pageType);
  const locked = customOnly && !isForest;
  const publicPath = publicPathForPage(site, page);
  const isHome = isHomePage(page);
  const heroImageUrl = isHome ? site.heroImageUrl : page.heroImageUrl || site.heroImageUrl;
  const [seoTitle, setSeoTitle] = useState(page.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription ?? "");
  const [showSeoForm, setShowSeoForm] = useState(false);
  const seoPreview = seoPreviewForPage(site, page);
  const hasCustomSeo = Boolean((page.seoTitle ?? "").trim() || (page.seoDescription ?? "").trim());
  const preset = presetForSlug(page.slug);
  const presetSettings = useMemo(() => preset ? presetSettingsFrom(page.settings, preset) : null, [page.settings, preset]);
  const [presetTitle, setPresetTitle] = useState(presetSettings?.title ?? "");
  const [presetIntro, setPresetIntro] = useState(presetSettings?.intro ?? "");
  const [presetItems, setPresetItems] = useState(presetSettings?.items.join("\n") ?? "");
  const [presetCtaLabel, setPresetCtaLabel] = useState(presetSettings?.ctaLabel ?? "");
  const [presetCampaignNote, setPresetCampaignNote] = useState(presetSettings?.campaignNote ?? "");
  const [presetOpeningHours, setPresetOpeningHours] = useState(presetSettings?.openingHours ?? "");
  const [presetBreakfastInfo, setPresetBreakfastInfo] = useState(presetSettings?.breakfastInfo ?? "");
  const [presetPrivateDiningNote, setPresetPrivateDiningNote] = useState(presetSettings?.privateDiningNote ?? "");

  useEffect(() => {
    setSeoTitle(page.seoTitle ?? "");
    setSeoDescription(page.seoDescription ?? "");
    setShowSeoForm(false);
    if (presetSettings) {
      setPresetTitle(presetSettings.title);
      setPresetIntro(presetSettings.intro);
      setPresetItems(presetSettings.items.join("\n"));
      setPresetCtaLabel(presetSettings.ctaLabel);
      setPresetCampaignNote(presetSettings.campaignNote ?? "");
      setPresetOpeningHours(presetSettings.openingHours ?? "");
      setPresetBreakfastInfo(presetSettings.breakfastInfo ?? "");
      setPresetPrivateDiningNote(presetSettings.privateDiningNote ?? "");
    }
  }, [page.seoDescription, page.seoTitle, page.slug, presetSettings]);

  return (
    <article className={`rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-5 ${locked ? "opacity-70" : ""}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-semibold text-[#18352f]">{page.name}</h3>
            <Badge tone={page.isPublished ? "green" : "gray"}>{page.isPublished ? "Published" : "Draft"}</Badge>
            {locked ? <Badge tone="sand">Forest</Badge> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Manage URL, publishing, SEO, and preview for this public page.</p>
        </div>
        <button type="button" disabled={locked} onClick={onToggle} className="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb] disabled:text-[#9aa29d]">
          {page.isPublished ? "Unpublish" : "Publish"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <PageMetaCard label="URL path" value={publicPath} />
        <PageMetaCard label="Page type" value={page.pageType} />
        <PageMetaCard label="Visibility" value={page.isPublished ? "Live on website" : "Draft only"} />
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-[#eadfce]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#18352f]">{isHome ? "Home hero image" : "Page hero image"}</p>
            <p className="mt-1 text-sm leading-6 text-[#6f7b74]">
              {isHome
                ? "Home uses the site hero from Page content > Hero."
                : page.heroImageUrl
                  ? "Using a custom hero image for this page."
                  : "Using main site hero image as fallback."}
            </p>
          </div>
          {isHome ? (
            <Badge tone="green">Site hero</Badge>
          ) : (
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
              {uploading ? "Uploading..." : "Upload page hero"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  if (file) {
                    onUpload(file);
                  }
                }}
                className="sr-only"
              />
            </label>
          )}
        </div>
        {heroImageUrl ? (
          <div className="aspect-video w-full max-w-md rounded-xl bg-cover bg-center shadow-sm" style={{ backgroundImage: `linear-gradient(rgba(24, 53, 47, 0.35), rgba(24, 53, 47, 0.35)), url(${heroImageUrl})` }} />
        ) : (
          <div className="flex aspect-video w-full max-w-md items-center justify-center rounded-xl border border-dashed border-[#d8cebb] bg-[#fbfaf7] text-sm text-[#6f7b74]">
            {isHome ? "No home hero image selected" : "No page or main hero image selected"}
          </div>
        )}
        {isHome ? (
          <p className="rounded-2xl bg-[#fbfaf7] p-3 text-sm leading-6 text-[#52615a]">
            Edit the Home hero image, title, subtitle, and CTA in the Hero section below.
          </p>
        ) : null}
        {uploadStatus ? <p className="rounded-2xl bg-[#fbfaf7] p-3 text-sm leading-6 text-[#52615a]">{uploadStatus}</p> : null}
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-[#eadfce]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#18352f]">SEO Preview</p>
              <Badge tone={hasCustomSeo ? "green" : "sand"}>{hasCustomSeo ? "Custom SEO" : "Auto-generated"}</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#6f7b74]">You can leave this empty. Travelseed will generate SEO from your page and property details.</p>
          </div>
          <button type="button" onClick={() => setShowSeoForm((current) => !current)} className="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
            {showSeoForm ? "Hide SEO" : "Customize SEO"}
          </button>
        </div>
        <div className="rounded-2xl bg-[#fbfaf7] p-4">
          <p className="text-base font-semibold text-[#18352f]">{seoPreview.title}</p>
          <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{seoPreview.description}</p>
        </div>
        {showSeoForm ? (
          <>
            <label className="grid gap-2 text-sm font-medium text-[#18352f]">
              SEO title
              <input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder={seoPreview.autoTitle} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#18352f]">
              SEO description
              <textarea value={seoDescription} rows={3} onChange={(event) => setSeoDescription(event.target.value)} placeholder={seoPreview.autoDescription} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
            </label>
            <div>
              <button type="button" disabled={locked} onClick={() => onSaveSeo(seoTitle, seoDescription)} className="min-h-10 rounded-full bg-[#18352f] px-4 text-sm font-semibold text-white disabled:bg-[#d8cebb] disabled:text-[#6f7b74]">
                Save SEO
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#eadfce]">
        {preset && presetSettings ? (
          <div className="grid gap-4 rounded-2xl bg-[#fbfaf7] p-4 ring-1 ring-[#eadfce]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#18352f]">Preset content</p>
                  <Badge tone="sand">{preset.label}</Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-[#6f7b74]">{preset.description}</p>
              </div>
            </div>
            <label className="grid gap-2 text-sm font-medium text-[#18352f]">
              {preset.editor.titleLabel}
              <input value={presetTitle} onChange={(event) => setPresetTitle(event.target.value)} placeholder={preset.settings.title} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#18352f]">
              {preset.editor.introLabel}
              <textarea value={presetIntro} rows={3} onChange={(event) => setPresetIntro(event.target.value)} placeholder={preset.settings.intro} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#18352f]">
              {preset.editor.itemsLabel}
              <textarea value={presetItems} rows={4} onChange={(event) => setPresetItems(event.target.value)} placeholder={preset.settings.items.join("\n")} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
              <span className="text-xs font-normal leading-5 text-[#6f7b74]">{preset.editor.itemsHelp}</span>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[#18352f]">
              {preset.editor.ctaLabel}
              <input value={presetCtaLabel} onChange={(event) => setPresetCtaLabel(event.target.value)} placeholder={preset.settings.ctaLabel} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
            </label>
            {preset.layout === "promotions" ? (
              <label className="grid gap-2 text-sm font-medium text-[#18352f]">
                Campaign note
                <textarea value={presetCampaignNote} rows={3} onChange={(event) => setPresetCampaignNote(event.target.value)} placeholder={preset.settings.campaignNote} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
                <span className="text-xs font-normal leading-5 text-[#6f7b74]">Shown near the Promotions CTA as campaign terms, availability notes, or booking guidance.</span>
              </label>
            ) : null}
            {preset.layout === "dining" ? (
              <div className="grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-[#eadfce]">
                <div>
                  <p className="text-sm font-semibold text-[#18352f]">Dining details</p>
                  <p className="mt-1 text-xs leading-5 text-[#6f7b74]">Use these fields for structured dining information on the public Dining page.</p>
                </div>
                <label className="grid gap-2 text-sm font-medium text-[#18352f]">
                  Opening hours
                  <input value={presetOpeningHours} onChange={(event) => setPresetOpeningHours(event.target.value)} placeholder={preset.settings.openingHours} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#18352f]">
                  Breakfast info
                  <textarea value={presetBreakfastInfo} rows={3} onChange={(event) => setPresetBreakfastInfo(event.target.value)} placeholder={preset.settings.breakfastInfo} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[#18352f]">
                  Private dining note
                  <textarea value={presetPrivateDiningNote} rows={3} onChange={(event) => setPresetPrivateDiningNote(event.target.value)} placeholder={preset.settings.privateDiningNote} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
                </label>
              </div>
            ) : null}
            <div>
              <button
                type="button"
                disabled={locked}
                onClick={() => onSaveSettings({
                  title: presetTitle,
                  intro: presetIntro,
                  items: presetItems.split("\n").map((item) => item.trim()).filter(Boolean),
                  ctaLabel: presetCtaLabel,
                  campaignNote: presetCampaignNote,
                  openingHours: presetOpeningHours,
                  breakfastInfo: presetBreakfastInfo,
                  privateDiningNote: presetPrivateDiningNote,
                })}
                className="min-h-10 rounded-full bg-[#18352f] px-4 text-sm font-semibold text-white disabled:bg-[#d8cebb] disabled:text-[#6f7b74]"
              >
                Save preset content
              </button>
            </div>
          </div>
        ) : null}
        <div>
          <p className="text-sm font-semibold text-[#18352f]">Page content</p>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">
            Edit this page&apos;s visible content here. Content with a dedicated operations area opens the relevant manager.
          </p>
        </div>
        {locked ? (
          <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#52615a]">Upgrade to Forest to edit this custom page.</p>
        ) : (
          <ContentManager
            site={site}
            accessToken={accessToken}
            onSiteUpdate={onSiteUpdate}
            onTabChange={onTabChange}
            onUnsavedChangesChange={onUnsavedChangesChange}
            selectedPageSlug={page.slug}
            embedded
          />
        )}
        <div>
          <a href={publicPath} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
            Preview Page
          </a>
        </div>
      </div>
    </article>
  );
}

function PageMetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-[#eadfce]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#72815e]">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-[#18352f]">{value}</p>
    </div>
  );
}

function NavigationPreview({ site, pages }: { site: ResortConsoleData; pages: SiteStructurePage[] }) {
  const publishedPages = pages.filter((page) => page.isPublished);

  return (
    <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#18352f]">Navigation preview</p>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Forest navigation is generated from published pages in the current order.</p>
        </div>
        <Badge tone="sand">Forest</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {publishedPages.map((page) => (
          <a key={page.slug} href={publicPathForPage(site, page)} target="_blank" rel="noreferrer" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#18352f] ring-1 ring-[#eadfce]">
            {page.name}
          </a>
        ))}
      </div>
    </div>
  );
}

function publicPathForPage(site: ResortConsoleData, page: SiteStructurePage) {
  return page.slug === "/" ? `/${site.slug}` : `/${site.slug}${page.slug}`;
}

function isHomePage(page: SiteStructurePage) {
  return page.slug === "/";
}

function seoPreviewForPage(site: ResortConsoleData, page: SiteStructurePage) {
  const autoTitle = page.slug === "/" ? `${site.name} | Direct Booking` : `${page.name} | ${site.name}`;
  const autoDescription = site.heroSubtitle || site.about || `${page.name} at ${site.name} in ${site.location}.`;
  const title = page.seoTitle?.trim() || autoTitle;
  const description = page.seoDescription?.trim() || autoDescription;

  return {
    title,
    description,
    autoTitle,
    autoDescription,
  };
}

function FeaturePill({ feature, locked }: { feature: string; locked: boolean }) {
  return (
    <div className={`rounded-full px-3 py-2 text-xs font-semibold ${locked ? "bg-[#f4f0e7] text-[#7b5b24]" : "bg-[#e6f0e7] text-[#1f5a45]"}`}>
      {locked ? "Locked · " : "Open · "}
      {feature}
    </div>
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
    heroImageUrl: page.hero_image_url ?? "",
    seoTitle: page.seo_title ?? "",
    seoDescription: page.seo_description ?? "",
    settings: page.settings ?? presetForSlug(page.slug)?.settings,
  };
}

function pageToApi(page: SiteStructurePage, index: number) {
  return {
    title: page.name,
    slug: page.slug,
    page_type: page.pageType,
    is_published: page.isPublished,
    hero_image_url: isHomePage(page) ? null : page.heroImageUrl || null,
    seo_title: page.seoTitle || null,
    seo_description: page.seoDescription || null,
    sort_order: index,
    settings: page.settings ?? {},
  };
}
