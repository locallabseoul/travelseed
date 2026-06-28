"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentManager } from "@/components/dashboard/ContentManager";
import { Badge, Panel } from "@/components/dashboard/ui";
import { effectivePlanType, forestCustomPages, landingSections, planConfig, treePages } from "@/components/dashboard/subscriptionConfig";
import { presetForSlug, presetSettingsFrom } from "@/lib/section-presets";
import type { DashboardConfirmOptions, DashboardTab, DashboardUnsavedChanges, PlanType, ResortConsoleData, SitePageContentCard, SitePageSettings, SiteStructurePage, SiteStructureSection } from "@/types/dashboard";

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
  landing: "One focused page with guided sections for WhatsApp inquiry conversion.",
  multipage: "A brand website with dedicated content pages and SEO-ready operations.",
  custom: "A flexible business website for premium campaigns and custom navigation.",
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Pages</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Website Pages</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{config.positioning}</p>
            {status ? <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{status}</p> : null}
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
          <h2 className="text-xl font-semibold text-slate-950">Manage Sections</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Starter sites are managed as one-page landing sections.</p>
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
          <h2 className="text-xl font-semibold text-slate-950">Page list</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Manage page content, publishing, SEO, and public previews for this business site.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onAddCustomPage} disabled={!isForest} className="min-h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm disabled:bg-slate-200 disabled:text-slate-500">
            Add Custom Page
          </button>
          <button type="button" onClick={() => setShowNavigation((current) => !current)} disabled={!isForest} className="min-h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 ring-1 ring-slate-200 disabled:text-slate-400">
            Navigation
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Page submenu" className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2 lg:grid lg:content-start lg:overflow-visible">
          {pages.map((page) => {
            const isSelected = page.slug === selectedPage?.slug;
            return (
              <button
                key={page.slug}
                type="button"
                onClick={() => setSelectedSlug(page.slug)}
                className={`flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${
                  isSelected ? "bg-slate-950 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-950"
                }`}
              >
                <span>{page.name}</span>
                <span className={`h-2 w-2 rounded-full ${page.isPublished ? "bg-emerald-500" : "bg-amber-400"} ${isSelected ? "ring-2 ring-white/30" : ""}`} />
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
    <Panel className="bg-slate-50 shadow-none">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Plan feature access</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {config.unlocked.length} available now · {config.locked.length > 0 ? `${config.locked.length} locked on ${config.label}` : "Everything unlocked"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="green">{config.label}</Badge>
          <button type="button" onClick={() => setExpanded((current) => !current)} className="min-h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
            {expanded ? "Hide features" : "View plan features"}
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <h3 className="text-sm font-semibold text-slate-950">Available now</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {config.unlocked.map((feature) => (
                <FeaturePill key={feature} feature={feature} locked={false} />
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-slate-950">Locked features</h3>
              {config.upgradeTarget ? (
                <button type="button" className="min-h-9 rounded-md bg-slate-950 px-4 text-xs font-semibold text-white">
                  Upgrade to {config.upgradeTarget}
                </button>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {config.locked.length > 0 ? config.locked.map((feature) => <FeaturePill key={feature} feature={feature} locked />) : <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">Everything is unlocked on Forest.</p>}
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
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
    </Panel>
  );
}

function SectionCard({ section, onToggle }: { section: SiteStructureSection; onToggle: () => void }) {
  return (
    <article className={`rounded-lg border p-4 ${section.locked ? "border-slate-200 bg-slate-100 opacity-75" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">{section.name}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{section.description}</p>
        </div>
        {section.locked ? <Badge tone="gray">Locked</Badge> : <Badge tone={section.isEnabled ? "green" : "sand"}>{section.isEnabled ? "On" : "Off"}</Badge>}
      </div>
      <button type="button" onClick={onToggle} disabled={section.locked} className="mt-4 min-h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 ring-1 ring-slate-200 disabled:text-slate-400">
        {section.locked ? "Upgrade" : section.isEnabled ? "Disable Section" : "Enable Section"}
      </button>
      {section.locked && section.lockReason ? <p className="mt-2 text-xs text-amber-700">{section.lockReason}</p> : null}
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
  const [presetCards, setPresetCards] = useState<SitePageContentCard[]>(presetSettings?.cards ?? []);
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);
  const [cardUploadStatus, setCardUploadStatus] = useState("");
  const supportsCards = Boolean(preset && ["dining", "activities"].includes(preset.layout) && preset.slug !== "/promotions");

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
      setPresetCards(presetSettings.cards);
      setCardUploadStatus("");
    }
  }, [page.seoDescription, page.seoTitle, page.slug, presetSettings]);

  async function uploadPresetCardImage(cardId: string, file: File) {
    if (!accessToken) {
      setCardUploadStatus("Sign in before uploading card images.");
      return;
    }

    setUploadingCardId(cardId);
    setCardUploadStatus("Uploading card image...");

    try {
      const formData = new FormData();
      formData.set("file", file, file.name);
      formData.set("folder", "page-content");
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
        throw new Error(data?.error ?? "Card image upload failed.");
      }

      const nextCards = presetCards.map((card) => (card.id === cardId ? { ...card, imageUrl: String(data.publicUrl) } : card));
      setPresetCards(nextCards);
      savePresetSettings(nextCards);
      setCardUploadStatus("Card image uploaded and saved.");
    } catch (error) {
      setCardUploadStatus(error instanceof Error ? error.message : "Card image upload failed.");
    } finally {
      setUploadingCardId(null);
    }
  }

  function savePresetSettings(nextPresetCards = presetCards) {
    const cards = nextPresetCards
      .map((card, index) => ({
        ...card,
        title: card.title.trim(),
        description: card.description.trim(),
        imageUrl: card.imageUrl.trim(),
        sortOrder: index,
      }))
      .filter((card) => card.title);

    onSaveSettings({
      title: presetTitle,
      intro: presetIntro,
      items: supportsCards ? cards.map((card) => card.title) : presetItems.split("\n").map((item) => item.trim()).filter(Boolean),
      cards: supportsCards ? cards : undefined,
      ctaLabel: presetCtaLabel,
      campaignNote: presetCampaignNote,
      openingHours: presetOpeningHours,
      breakfastInfo: presetBreakfastInfo,
      privateDiningNote: presetPrivateDiningNote,
    });
  }

  return (
    <article className={`rounded-xl border border-slate-200 bg-slate-50 p-5 ${locked ? "opacity-70" : ""}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-semibold text-slate-950">{page.name}</h3>
            <Badge tone={page.isPublished ? "green" : "gray"}>{page.isPublished ? "Published" : "Draft"}</Badge>
            {locked ? <Badge tone="sand">Forest</Badge> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">Manage URL, publishing, SEO, and preview for this public page.</p>
        </div>
        <button type="button" disabled={locked} onClick={onToggle} className="min-h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 ring-1 ring-slate-200 disabled:text-slate-400">
          {page.isPublished ? "Unpublish" : "Publish"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <PageMetaCard label="URL path" value={publicPath} />
        <PageMetaCard label="Page type" value={page.pageType} />
        <PageMetaCard label="Visibility" value={page.isPublished ? "Live on website" : "Draft only"} />
      </div>

      <div className="mt-5 grid gap-4 rounded-lg bg-white p-4 ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">{isHome ? "Home hero image" : "Page hero image"}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
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
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
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
          <div className="flex aspect-video w-full max-w-md items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            {isHome ? "No home hero image selected" : "No page or main hero image selected"}
          </div>
        )}
        {isHome ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            Edit the Home hero image, title, subtitle, and CTA in the Hero section below.
          </p>
        ) : null}
        {uploadStatus ? <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{uploadStatus}</p> : null}
      </div>

      <div className="mt-5 grid gap-4 rounded-lg bg-white p-4 ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-950">SEO Preview</p>
              <Badge tone={hasCustomSeo ? "green" : "sand"}>{hasCustomSeo ? "Custom SEO" : "Auto-generated"}</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-500">You can leave this empty. Travelseed will generate SEO from your page and business details.</p>
          </div>
          <button type="button" onClick={() => setShowSeoForm((current) => !current)} className="min-h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
            {showSeoForm ? "Hide SEO" : "Customize SEO"}
          </button>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-base font-semibold text-[#1a0dab]">{seoPreview.title}</p>
          <p className="mt-1 text-xs text-emerald-700">{publicPath}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{seoPreview.description}</p>
        </div>
        {showSeoForm ? (
          <>
            <label className="grid gap-2 text-sm font-medium text-slate-950">
              SEO title
              <input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder={seoPreview.autoTitle} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-950">
              SEO description
              <textarea value={seoDescription} rows={3} onChange={(event) => setSeoDescription(event.target.value)} placeholder={seoPreview.autoDescription} className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <div>
              <button type="button" disabled={locked} onClick={() => onSaveSeo(seoTitle, seoDescription)} className="min-h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-slate-500">
                Save SEO
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        {preset && presetSettings ? (
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">Preset content</p>
                  <Badge tone="sand">{preset.label}</Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{preset.description}</p>
              </div>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-950">
              {preset.editor.titleLabel}
              <input value={presetTitle} onChange={(event) => setPresetTitle(event.target.value)} placeholder={preset.settings.title} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-950">
              {preset.editor.introLabel}
              <textarea value={presetIntro} rows={3} onChange={(event) => setPresetIntro(event.target.value)} placeholder={preset.settings.intro} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600" />
            </label>
            {supportsCards ? (
              <PresetCardsEditor
                label={preset.editor.itemsLabel}
                help={preset.editor.itemsHelp}
                cards={presetCards}
                uploadingCardId={uploadingCardId}
                onChange={setPresetCards}
                onUploadImage={(cardId, file) => void uploadPresetCardImage(cardId, file)}
              />
            ) : (
              <label className="grid gap-2 text-sm font-medium text-slate-950">
                {preset.editor.itemsLabel}
                <textarea value={presetItems} rows={4} onChange={(event) => setPresetItems(event.target.value)} placeholder={preset.settings.items.join("\n")} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600" />
                <span className="text-xs font-normal leading-5 text-slate-600">{preset.editor.itemsHelp}</span>
              </label>
            )}
            {cardUploadStatus ? <p className="rounded-2xl bg-white p-3 text-sm leading-6 text-slate-600">{cardUploadStatus}</p> : null}
            <label className="grid gap-2 text-sm font-medium text-slate-950">
              {preset.editor.ctaLabel}
              <input value={presetCtaLabel} onChange={(event) => setPresetCtaLabel(event.target.value)} placeholder={preset.settings.ctaLabel} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600" />
            </label>
            {preset.layout === "promotions" ? (
              <label className="grid gap-2 text-sm font-medium text-slate-950">
                Campaign note
                <textarea value={presetCampaignNote} rows={3} onChange={(event) => setPresetCampaignNote(event.target.value)} placeholder={preset.settings.campaignNote} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600" />
                <span className="text-xs font-normal leading-5 text-slate-600">Shown near the Promotions CTA as campaign terms, availability notes, or booking guidance.</span>
              </label>
            ) : null}
            {preset.layout === "dining" ? (
              <div className="grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Dining details</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Use these fields for structured dining information on the public Dining page.</p>
                </div>
                <label className="grid gap-2 text-sm font-medium text-slate-950">
                  Opening hours
                  <input value={presetOpeningHours} onChange={(event) => setPresetOpeningHours(event.target.value)} placeholder={preset.settings.openingHours} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-950">
                  Breakfast info
                  <textarea value={presetBreakfastInfo} rows={3} onChange={(event) => setPresetBreakfastInfo(event.target.value)} placeholder={preset.settings.breakfastInfo} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-950">
                  Private dining note
                  <textarea value={presetPrivateDiningNote} rows={3} onChange={(event) => setPresetPrivateDiningNote(event.target.value)} placeholder={preset.settings.privateDiningNote} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600" />
                </label>
              </div>
            ) : null}
            <div>
              <button
                type="button"
                disabled={locked}
                onClick={() => savePresetSettings()}
                className="min-h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-slate-600"
              >
                Save preset content
              </button>
            </div>
          </div>
        ) : null}
        <div>
          <p className="text-sm font-semibold text-slate-950">Page content</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Edit this page&apos;s visible content here. Content with a dedicated operations area opens the relevant manager.
          </p>
        </div>
        {locked ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">Upgrade to Forest to edit this custom page.</p>
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
          <a href={publicPath} target="_blank" rel="noreferrer" className="inline-flex rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-950 ring-1 ring-slate-200">
            Preview Page
          </a>
        </div>
      </div>
    </article>
  );
}

function PageMetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PresetCardsEditor({
  label,
  help,
  cards,
  uploadingCardId,
  onChange,
  onUploadImage,
}: {
  label: string;
  help: string;
  cards: SitePageContentCard[];
  uploadingCardId: string | null;
  onChange: (cards: SitePageContentCard[]) => void;
  onUploadImage: (cardId: string, file: File) => void;
}) {
  function updateCard(cardId: string, patch: Partial<SitePageContentCard>) {
    onChange(cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)));
  }

  function addCard() {
    const nextIndex = cards.length + 1;
    onChange([
      ...cards,
      {
        id: `card-${Date.now()}`,
        title: `New highlight ${nextIndex}`,
        description: "",
        imageUrl: "",
        sortOrder: cards.length,
      },
    ]);
  }

  function removeCard(cardId: string) {
    onChange(cards.filter((card) => card.id !== cardId).map((card, index) => ({ ...card, sortOrder: index })));
  }

  function moveCard(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= cards.length) {
      return;
    }

    const nextCards = [...cards];
    [nextCards[index], nextCards[nextIndex]] = [nextCards[nextIndex], nextCards[index]];
    onChange(nextCards.map((card, cardIndex) => ({ ...card, sortOrder: cardIndex })));
  }

  return (
    <div className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">{label}</p>
          <p className="mt-1 text-xs font-normal leading-5 text-slate-600">{help}</p>
        </div>
        <button type="button" onClick={addCard} className="min-h-9 rounded-md bg-slate-950 px-4 text-xs font-semibold text-white">
          Add card
        </button>
      </div>

      <div className="grid gap-3">
        {cards.map((card, index) => (
          <article key={card.id} className="grid gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 md:grid md:grid-cols-[160px_minmax(0,1fr)]">
              <div>
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 bg-cover bg-center" style={card.imageUrl ? { backgroundImage: `url(${card.imageUrl})` } : undefined} />
                <label className="mt-2 inline-flex min-h-9 w-full cursor-pointer items-center justify-center rounded-md bg-white px-3 text-xs font-semibold text-slate-950 ring-1 ring-slate-200">
                  {uploadingCardId === card.id ? "Uploading..." : card.imageUrl ? "Replace image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    disabled={uploadingCardId === card.id}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.currentTarget.value = "";
                      if (file) {
                        onUploadImage(card.id, file);
                      }
                    }}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-2 text-sm font-medium text-slate-950">
                  Title
                  <input value={card.title} onChange={(event) => updateCard(card.id, { title: event.target.value })} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-950">
                  Description
                  <textarea value={card.description} rows={3} onChange={(event) => updateCard(card.id, { description: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600" />
                </label>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => moveCard(index, -1)} disabled={index === 0} className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-950 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
                Up
              </button>
              <button type="button" onClick={() => moveCard(index, 1)} disabled={index === cards.length - 1} className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-950 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
                Down
              </button>
              <button type="button" onClick={() => removeCard(card.id)} className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function NavigationPreview({ site, pages }: { site: ResortConsoleData; pages: SiteStructurePage[] }) {
  const publishedPages = pages.filter((page) => page.isPublished);

  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Navigation preview</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">Forest navigation is generated from published pages in the current order.</p>
        </div>
        <Badge tone="sand">Forest</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {publishedPages.map((page) => (
          <a key={page.slug} href={publicPathForPage(site, page)} target="_blank" rel="noreferrer" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
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
  const autoTitle = page.slug === "/" ? `${site.name} | WhatsApp Website` : `${page.name} | ${site.name}`;
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
    <div className={`rounded-full px-3 py-2 text-xs font-semibold ${locked ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
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
