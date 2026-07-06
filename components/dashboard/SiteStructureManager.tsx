"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentManager } from "@/components/dashboard/ContentManager";
import { Badge, Panel } from "@/components/dashboard/ui";
import { effectivePlanType, forestCustomPages, landingSections, planConfig, treePages } from "@/components/dashboard/subscriptionConfig";
import {
  dashboardCategoryCopyFor,
  dashboardPageDescriptionFor,
  dashboardPageNameFor,
  dashboardSectionDisplay,
  type DashboardCategoryCopy,
} from "@/lib/dashboard-category-copy";
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
  const dashboardCopy = dashboardCategoryCopyFor(site);
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
            .map((page, index) => ({ label: dashboardPageNameFor(page, dashboardCopy), href: page.slug, sort_order: index, is_enabled: true })),
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
      const pageName = dashboardPageNameFor(page, dashboardCopy);
      requestConfirmation({
      title: page.isPublished ? `Unpublish ${pageName}?` : `Publish ${pageName}?`,
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
        {isLanding ? (
          <LandingSectionsView sections={sections} dashboardCopy={dashboardCopy} onToggle={toggleSection} />
        ) : (
          <PagesView
            site={site}
            dashboardCopy={dashboardCopy}
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
      {status ? <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{status}</p> : null}
        <FeatureAccessDisclosure planType={planType} />
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

function LandingSectionsView({
  sections,
  dashboardCopy,
  onToggle,
}: {
  sections: SiteStructureSection[];
  dashboardCopy: DashboardCategoryCopy;
  onToggle: (section: SiteStructureSection) => void;
}) {
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
          <SectionCard key={section.name} section={section} dashboardCopy={dashboardCopy} onToggle={() => onToggle(section)} />
        ))}
      </div>
    </Panel>
  );
}

function PagesView({
  site,
  dashboardCopy,
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
  dashboardCopy: DashboardCategoryCopy;
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
  const [pageFilter, setPageFilter] = useState<"all" | "draft">("all");
  const [query, setQuery] = useState("");
  const selectedPage = pages.find((page) => page.slug === selectedSlug) ?? pages[0];
  const filteredPages = pages.filter((page) => {
    const pageName = dashboardPageNameFor(page, dashboardCopy);
    const matchesQuery = [pageName, page.slug, page.pageType].some((value) => value.toLowerCase().includes(query.trim().toLowerCase()));
    const matchesFilter = pageFilter === "all" || !page.isPublished;
    return matchesQuery && matchesFilter;
  });
  const draftCount = pages.filter((page) => !page.isPublished).length;

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
      setUploadStatus(`Uploading ${dashboardPageNameFor(page, dashboardCopy)} hero image...`);

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
      setUploadStatus(`${dashboardPageNameFor(page, dashboardCopy)} hero image uploaded and saved.`);
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
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">{site.name}</span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-sm font-semibold text-slate-950">Pages</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Website Pages</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your website&apos;s content and structure.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowNavigation((current) => !current)} disabled={!isForest} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:text-slate-400">
            <PageIcon name="folder" className="h-4 w-4 text-slate-400" />
            Navigation
          </button>
          <button type="button" onClick={onAddCustomPage} disabled={!isForest} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500">
            <PageIcon name="plus" className="h-4 w-4" />
            Create Page
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button type="button" onClick={() => setPageFilter("all")} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${pageFilter === "all" ? "border border-slate-200 bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>
              All Pages ({pages.length})
            </button>
            <button type="button" onClick={() => setPageFilter("draft")} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${pageFilter === "draft" ? "border border-slate-200 bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}>
              Drafts ({draftCount})
            </button>
          </div>
          <label className="relative sm:w-64">
            <PageIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search pages..." className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="w-12 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500" />
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Page Name</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="hidden px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 md:table-cell">Last Edited</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPages.map((page) => {
                const pageName = dashboardPageNameFor(page, dashboardCopy);
                const isSelected = page.slug === selectedPage?.slug;
                return (
                  <tr key={page.slug} onClick={() => setSelectedSlug(page.slug)} className={`group cursor-pointer transition hover:bg-slate-50 ${isSelected ? "bg-emerald-50/50" : ""} ${page.isPublished ? "" : "opacity-80"}`}>
                    <td className="px-6 py-4 text-slate-400"><PageIcon name="grip" className="h-4 w-4" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PageIcon name={isHomePage(page) ? "home" : iconForPage(page)} className="h-5 w-5 text-slate-400" />
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                            {pageName}
                            {isHomePage(page) ? <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Index</span> : null}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">{page.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${page.isPublished ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${page.isPublished ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {page.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-slate-500 md:table-cell">Recently by Travelseed</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedSlug(page.slug); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-950" title="Edit">
                          <PageIcon name="edit" className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={(event) => { event.stopPropagation(); onToggle(page); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-950" title={page.isPublished ? "Unpublish" : "Publish"}>
                          <PageIcon name={page.isPublished ? "hidden" : "eye"} className="h-4 w-4" />
                        </button>
                        <a href={publicPathForPage(site, page)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-950" title="Preview">
                          <PageIcon name="more" className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {selectedPage ? (
          <>
            <PageEditorEntry page={selectedPage} site={site} dashboardCopy={dashboardCopy} onOpen={() => setSelectedSlug(selectedPage.slug)} />
            <SeoSummaryCard site={site} page={selectedPage} dashboardCopy={dashboardCopy} onEdit={() => setSelectedSlug(selectedPage.slug)} />
          </>
        ) : null}
      </div>

      {selectedPage ? (
        <PageDetail
          site={site}
          dashboardCopy={dashboardCopy}
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
      {showNavigation && isForest ? <NavigationPreview site={site} pages={pages} dashboardCopy={dashboardCopy} /> : null}
    </div>
  );
}

function PageEditorEntry({
  page,
  site,
  dashboardCopy,
  onOpen,
}: {
  page: SiteStructurePage;
  site: ResortConsoleData;
  dashboardCopy: DashboardCategoryCopy;
  onOpen: () => void;
}) {
  const pageName = dashboardPageNameFor(page, dashboardCopy);
  const sections = editorSectionsFor(page, site, dashboardCopy);

  return (
    <article className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
          <PageIcon name="layers" className="h-5 w-5 text-emerald-500" />
          Edit &quot;{pageName}&quot; Content
        </h2>
        <button type="button" onClick={onOpen} className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700">
          Open Full Editor →
        </button>
      </div>
      <div className="flex-1 space-y-3">
        {sections.map((section) => (
          <button key={section.title} type="button" onClick={onOpen} className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-300">
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-500 transition group-hover:bg-emerald-50 group-hover:text-emerald-600">
                <PageIcon name={section.icon} className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-950">{section.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{section.description}</span>
              </span>
            </span>
            <PageIcon name="chevronRight" className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-500" />
          </button>
        ))}
        <button type="button" onClick={onOpen} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-950">
          <PageIcon name="plus" className="h-4 w-4" />
          Add Section
        </button>
      </div>
    </article>
  );
}

function SeoSummaryCard({
  site,
  page,
  dashboardCopy,
  onEdit,
}: {
  site: ResortConsoleData;
  page: SiteStructurePage;
  dashboardCopy: DashboardCategoryCopy;
  onEdit: () => void;
}) {
  const pageName = dashboardPageNameFor(page, dashboardCopy);
  const preview = seoPreviewForPage(site, page, pageName);
  const publicPath = publicPathForPage(site, page);
  const titleLength = preview.title.length;
  const descriptionLength = preview.description.length;

  return (
    <article className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
          <span className="text-blue-500">G</span>
          Search Preview
        </h2>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-950">
          <PageIcon name="edit" className="h-3.5 w-3.5" />
          Edit SEO
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600">{site.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="mb-0.5 text-[13px] font-medium leading-none text-[#202124]">{site.name}</p>
            <p className="text-[12px] leading-none text-[#4d5156]">{publicPath}</p>
          </div>
        </div>
        <h3 className="mb-1 cursor-pointer text-[20px] font-normal leading-tight text-[#1a0dab] hover:underline">{preview.title}</h3>
        <p className="text-[14px] leading-[1.58] text-[#4d5156]">{preview.description}</p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-700">Page Title</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">{preview.title}</div>
          <p className="mt-1 flex justify-between text-[10px] text-slate-500"><span>Recommended: 50-60 characters</span><span className={titleLength <= 60 ? "text-emerald-600" : "text-amber-600"}>{titleLength}/60</span></p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-700">Meta Description</p>
          <div className="min-h-20 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-900">{preview.description}</div>
          <p className="mt-1 flex justify-between text-[10px] text-slate-500"><span>Recommended: 150-160 characters</span><span className={descriptionLength <= 160 ? "text-emerald-600" : "text-amber-600"}>{descriptionLength}/160</span></p>
        </div>
      </div>
    </article>
  );
}

function editorSectionsFor(page: SiteStructurePage, site: ResortConsoleData, dashboardCopy: DashboardCategoryCopy): Array<{ title: string; description: string; icon: PageIconName }> {
  if (isHomePage(page)) {
    return [
      { title: "Hero Header", description: "Main image, title, and WhatsApp CTA", icon: "image" },
      { title: "About Us", description: "Welcome text and short description", icon: "text" },
      { title: dashboardCopy.pages.offersLabel, description: `${site.services.length || 0} selected offers and services`, icon: "bed" },
    ];
  }

  return [
    { title: "Page Header", description: "Hero image, page title, and intro copy", icon: "image" },
    { title: "Page Body", description: "Visible content and structured sections", icon: "text" },
    { title: "Inquiry CTA", description: "WhatsApp action and customer message path", icon: "bed" },
  ];
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

function SectionCard({ section, dashboardCopy, onToggle }: { section: SiteStructureSection; dashboardCopy: DashboardCategoryCopy; onToggle: () => void }) {
  const display = dashboardSectionDisplay(section, dashboardCopy);

  return (
    <article className={`rounded-lg border p-4 ${section.locked ? "border-slate-200 bg-slate-100 opacity-75" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">{display.name}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{display.description}</p>
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
  dashboardCopy,
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
  dashboardCopy: DashboardCategoryCopy;
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
  const pageName = dashboardPageNameFor(page, dashboardCopy);
  const pageDescription = dashboardPageDescriptionFor(page, dashboardCopy);
  const heroImageUrl = isHome ? site.heroImageUrl : page.heroImageUrl || site.heroImageUrl;
  const [seoTitle, setSeoTitle] = useState(page.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription ?? "");
  const [showSeoForm, setShowSeoForm] = useState(false);
  const seoPreview = seoPreviewForPage(site, page, pageName);
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
            <h3 className="text-2xl font-semibold text-slate-950">{pageName}</h3>
            <Badge tone={page.isPublished ? "green" : "gray"}>{page.isPublished ? "Published" : "Draft"}</Badge>
            {locked ? <Badge tone="sand">Forest</Badge> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{pageDescription}</p>
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
                  <p className="text-sm font-semibold text-slate-950">{pageName} details</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Use these fields for structured information on the public {pageName} page.</p>
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
                  {pageName} note
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

function NavigationPreview({ site, pages, dashboardCopy }: { site: ResortConsoleData; pages: SiteStructurePage[]; dashboardCopy: DashboardCategoryCopy }) {
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
            {dashboardPageNameFor(page, dashboardCopy)}
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

function seoPreviewForPage(site: ResortConsoleData, page: SiteStructurePage, pageName: string) {
  const autoTitle = page.slug === "/" ? `${site.name} | WhatsApp Website` : `${pageName} | ${site.name}`;
  const autoDescription = site.heroSubtitle || site.about || `${pageName} at ${site.name} in ${site.location}.`;
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

type PageIconName = "bed" | "chevronRight" | "edit" | "eye" | "file" | "folder" | "grip" | "hidden" | "home" | "image" | "layers" | "more" | "plus" | "search" | "text" | "utensils";

function iconForPage(page: SiteStructurePage): PageIconName {
  const slug = page.slug.toLowerCase();
  if (slug.includes("dining") || slug.includes("menu")) return "utensils";
  if (slug.includes("gallery")) return "image";
  if (slug.includes("offer") || slug.includes("villa") || slug.includes("room") || slug.includes("service")) return "bed";
  return "file";
}

function PageIcon({ name, className }: { name: PageIconName; className: string }) {
  const strokeProps = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "bed":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M3 7v11" /><path d="M21 11v7" /><path d="M3 14h18" /><path d="M7 11h4" /><path d="M7 7h4a2 2 0 0 1 2 2v5H5V9a2 2 0 0 1 2-2Z" /></svg>;
    case "chevronRight":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m9 18 6-6-6-6" /></svg>;
    case "edit":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>;
    case "eye":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "file":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></svg>;
    case "folder":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></svg>;
    case "grip":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M8 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM8 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM8 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" /></svg>;
    case "hidden":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M3 3l18 18" /><path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" /><path d="M9.9 5.2A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a16.2 16.2 0 0 1-3.1 4.2" /><path d="M6.6 6.6C3.6 8.6 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.4-1" /></svg>;
    case "home":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>;
    case "image":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.5" /><path d="m21 15-5-5L5 19" /></svg>;
    case "layers":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></svg>;
    case "more":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" /></svg>;
    case "plus":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
    case "search":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
    case "text":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /></svg>;
    case "utensils":
      return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}><path d="M4 3v8" /><path d="M8 3v8" /><path d="M4 7h4" /><path d="M6 11v10" /><path d="M17 3c-2 2-3 4-3 7v4h4V3" /><path d="M18 14v7" /></svg>;
  }
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
