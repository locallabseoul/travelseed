import { useEffect, useState } from "react";
import { FeatureSelector } from "@/components/dashboard/FeatureSelector";
import { contentSections } from "@/components/dashboard/mockData";
import { effectivePlanType, planConfig } from "@/components/dashboard/subscriptionConfig";
import { Badge, Panel } from "@/components/dashboard/ui";
import type { ContentSection, DashboardTab, DashboardUnsavedChanges, ResortConsoleData } from "@/types/dashboard";

type EditableSection = "Hero" | "About" | "Features" | "Gallery" | "Experiences" | "Inquiry CTA" | "Footer";
type ContentPageKey = "home" | "rooms" | "experiences" | "gallery" | "reviews" | "dining" | "about" | "contact" | "promotions" | "blog";

type PageContentBlock = ContentSection & {
  kind: "editable" | "linked" | "comingSoon";
  editTarget?: EditableSection;
  targetTab?: DashboardTab;
  helper?: string;
};

type ContentPage = {
  key: ContentPageKey;
  label: string;
  slug: string;
  blocks: PageContentBlock[];
};

function isEditableSection(title: ContentSection["title"]): title is EditableSection {
  return ["Hero", "About", "Features", "Gallery", "Experiences", "Inquiry CTA", "Footer"].includes(title);
}

function blockFor(section: ContentSection, overrides: Partial<PageContentBlock> = {}): PageContentBlock {
  return {
    ...section,
    kind: isEditableSection(section.title) ? "editable" : "comingSoon",
    editTarget: isEditableSection(section.title) ? section.title : undefined,
    ...overrides,
  };
}

function landingBlocks() {
  return contentSections.map((section) => blockFor(section));
}

function pageBlock(title: PageContentBlock["title"], description: string, status: ContentSection["status"], overrides: Partial<PageContentBlock> = {}): PageContentBlock {
  return blockFor({ title, description, status }, overrides);
}

function pagesForSite(site: ResortConsoleData): ContentPage[] {
  return [
    {
      key: "home",
      label: "Home",
      slug: "/",
      blocks: [
        pageBlock("Hero", "Main homepage headline, subtitle, image, and CTA.", "Ready"),
        pageBlock("About", "Homepage brand story and business positioning.", "Ready"),
        pageBlock("Features", "Homepage highlights, facilities, services, and customer benefits.", site.features.length > 0 ? "Ready" : "Needs review"),
        pageBlock("Inquiry CTA", "Homepage WhatsApp inquiry block.", "Ready"),
      ],
    },
    {
      key: "rooms",
      label: "Offers",
      slug: "/rooms",
      blocks: [
        pageBlock("Offers", "Services, packages, products, menu items, tours, or rooms shown on the Offers page.", site.services.length > 0 ? "Ready" : "Needs review", {
          kind: "linked",
          targetTab: "offers",
          helper: "Services, packages, and rooms are managed as Offers so pricing, images, and offer types stay consistent.",
        }),
        pageBlock("Inquiry CTA", "Inquiry message used from offer cards.", "Ready"),
      ],
    },
    {
      key: "experiences",
      label: "Experiences",
      slug: "/experiences",
      blocks: [
        pageBlock("Experiences", "Nearby beaches, activities, restaurants, and local attractions.", site.experiences.length > 0 ? "Ready" : "Needs review"),
        pageBlock("Inquiry CTA", "Direct inquiry CTA at the bottom of the Experiences page.", "Ready"),
      ],
    },
    {
      key: "gallery",
      label: "Gallery",
      slug: "/gallery",
      blocks: [
        pageBlock("Gallery", "Curated photos for storefront, team, services, products, rooms, food, and area.", site.gallery.length > 0 ? "Ready" : "Needs review"),
      ],
    },
    {
      key: "reviews",
      label: "Reviews",
      slug: "/reviews",
      blocks: [
        pageBlock("Reviews", "Published testimonials shown on the Reviews page.", "Ready", {
          kind: "linked",
          targetTab: "reviews",
          helper: "Review content is managed separately so testimonial publishing rules stay clear.",
        }),
      ],
    },
    {
      key: "dining",
      label: "Dining",
      slug: "/dining",
      blocks: [
        pageBlock("Dining", "Restaurant, bar, breakfast, and culinary content.", "Draft", {
          kind: "comingSoon",
          helper: "Dining CMS is planned for a later content operations phase.",
        }),
      ],
    },
    {
      key: "about",
      label: "About",
      slug: "/about",
      blocks: [
        pageBlock("About", "Business story, positioning, and location context.", "Ready"),
        pageBlock("Features", "Facilities and practical selling points for the About page.", site.features.length > 0 ? "Ready" : "Needs review"),
      ],
    },
    {
      key: "contact",
      label: "Contact",
      slug: "/contact",
      blocks: [
        pageBlock("Inquiry CTA", "WhatsApp inquiry message template and direct inquiry prompt.", "Ready"),
        pageBlock("Footer", "Business name and location used in the site footer.", "Needs review"),
      ],
    },
    {
      key: "promotions",
      label: "Promotions",
      slug: "/promotions",
      blocks: [
        pageBlock("Promotions", "WhatsApp offers shown on the Promotions page.", "Draft", {
          kind: "linked",
          targetTab: "offers",
          helper: "Offer cards are managed in Offers and can later be promoted into this public page.",
        }),
      ],
    },
    {
      key: "blog",
      label: "Blog",
      slug: "/blog",
      blocks: [
        pageBlock("Blog", "Editorial updates, guides, and SEO articles.", "Draft", {
          kind: "comingSoon",
          helper: "Blog CMS is planned for a later content operations phase.",
        }),
      ],
    },
  ];
}

function pageKeyFromSlug(slug?: string): ContentPageKey {
  const normalizedSlug = (slug ?? "/").replace(/^\/+|\/+$/g, "");

  if (!normalizedSlug) {
    return "home";
  }

  if (["rooms", "experiences", "gallery", "reviews", "dining", "about", "contact", "promotions", "blog"].includes(normalizedSlug)) {
    return normalizedSlug as ContentPageKey;
  }

  return "blog";
}

function pageLabelFromSlug(slug?: string) {
  const normalizedSlug = (slug ?? "/").replace(/^\/+|\/+$/g, "");

  if (!normalizedSlug) {
    return "Home";
  }

  return normalizedSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ContentManager({
  site,
  accessToken,
  onSiteUpdate,
  onTabChange,
  selectedPageSlug,
  embedded = false,
  onUnsavedChangesChange,
}: {
  site: ResortConsoleData;
  accessToken: string | null;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  onTabChange: (tab: DashboardTab) => void;
  selectedPageSlug?: string;
  embedded?: boolean;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
}) {
  const planType = effectivePlanType(site);
  const isLanding = planConfig[planType].siteType === "landing";
  const pages = pagesForSite(site);
  const [selectedPageKey, setSelectedPageKey] = useState<ContentPageKey>(pageKeyFromSlug(selectedPageSlug));
  const effectivePageKey = embedded ? pageKeyFromSlug(selectedPageSlug) : selectedPageKey;
  const selectedPage = pages.find((page) => page.key === effectivePageKey && (!embedded || page.slug === (selectedPageSlug ?? page.slug))) ?? {
    key: effectivePageKey,
    label: pageLabelFromSlug(selectedPageSlug),
    slug: selectedPageSlug ?? "/",
    blocks: [
      pageBlock("Custom page", "Content editing for this custom page will be added in a later Forest content phase.", "Draft", {
        kind: "comingSoon",
        helper: "Custom pages can be published and configured now. Dedicated custom page content fields are not available yet.",
      }),
    ],
  };
  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [heroTitle, setHeroTitle] = useState(site.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(site.heroSubtitle);
  const [heroImageUrl, setHeroImageUrl] = useState(site.heroImageUrl);
  const [heroCta, setHeroCta] = useState(site.heroCta);
  const [footerName, setFooterName] = useState(site.name);
  const [footerLocation, setFooterLocation] = useState(site.location);
  const [about, setAbout] = useState(site.about);
  const [features, setFeatures] = useState<string[]>(site.features);
  const [gallery, setGallery] = useState(site.gallery.join("\n"));
  const [experiences, setExperiences] = useState(site.experiences.join("\n"));
  const [bookingMessageTemplate, setBookingMessageTemplate] = useState(site.bookingMessageTemplate);
  const [uploading, setUploading] = useState<"hero" | "gallery" | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const hasEditingChanges = Boolean(editingSection) && (
    heroTitle !== site.heroTitle ||
    heroSubtitle !== site.heroSubtitle ||
    heroImageUrl !== site.heroImageUrl ||
    heroCta !== site.heroCta ||
    footerName !== site.name ||
    footerLocation !== site.location ||
    about !== site.about ||
    features.join("\n") !== site.features.join("\n") ||
    gallery !== site.gallery.join("\n") ||
    experiences !== site.experiences.join("\n") ||
    bookingMessageTemplate !== site.bookingMessageTemplate
  );

  useEffect(() => {
    setHeroTitle(site.heroTitle);
    setHeroSubtitle(site.heroSubtitle);
    setHeroImageUrl(site.heroImageUrl);
    setHeroCta(site.heroCta);
    setFooterName(site.name);
    setFooterLocation(site.location);
    setAbout(site.about);
    setFeatures(site.features);
    setGallery(site.gallery.join("\n"));
    setExperiences(site.experiences.join("\n"));
    setBookingMessageTemplate(site.bookingMessageTemplate);
  }, [site.about, site.bookingMessageTemplate, site.experiences, site.features, site.gallery, site.heroCta, site.heroImageUrl, site.heroSubtitle, site.heroTitle, site.id, site.location, site.name]);

  useEffect(() => {
    setEditingSection(null);
    setSelectedPageKey(pageKeyFromSlug(selectedPageSlug));
  }, [selectedPageSlug, site.id]);

  useEffect(() => {
    onUnsavedChangesChange?.({
      isDirty: hasEditingChanges,
      title: "Discard content changes?",
      description: "You have content edits that have not been saved. Continue without saving them?",
    });

    return () => onUnsavedChangesChange?.({ isDirty: false, title: "", description: "" });
  }, [hasEditingChanges, onUnsavedChangesChange]);

  function startEditing(section: EditableSection) {
    setEditingSection(section);
    setHeroTitle(site.heroTitle);
    setHeroSubtitle(site.heroSubtitle);
    setHeroImageUrl(site.heroImageUrl);
    setHeroCta(site.heroCta);
    setFooterName(site.name);
    setFooterLocation(site.location);
    setAbout(site.about);
    setFeatures(site.features);
    setGallery(site.gallery.join("\n"));
    setExperiences(site.experiences.join("\n"));
    setBookingMessageTemplate(site.bookingMessageTemplate);
    setUploadStatus("");
  }

  async function uploadImage(file: File, folder: "hero" | "gallery") {
    if (!accessToken) {
      throw new Error("Sign in before uploading images.");
    }

    const formData = new FormData();
    formData.set("file", file, file.name);
    formData.set("folder", folder);
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
      throw new Error(data?.error ?? "Image upload failed.");
    }

    return String(data.publicUrl);
  }

  async function uploadHeroImage(file: File) {
    setUploading("hero");
    setUploadStatus("Uploading hero image...");
    try {
      const publicUrl = await uploadImage(file, "hero");
      setHeroImageUrl(publicUrl);
      await onSiteUpdate({ ...site, heroTitle, heroSubtitle, heroImageUrl: publicUrl, heroCta });
      setUploadStatus("Hero image uploaded and saved.");
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Hero image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function uploadGalleryImages(files: File[]) {
    setUploading("gallery");
    setUploadStatus(`Uploading ${files.length} gallery image${files.length > 1 ? "s" : ""}...`);
    try {
      const uploadedUrls = await Promise.all(files.map((file) => uploadImage(file, "gallery")));
      const nextGallery = [...gallery.split("\n").map((item) => item.trim()).filter(Boolean), ...uploadedUrls];
      setGallery(nextGallery.join("\n"));
      await onSiteUpdate({ ...site, gallery: nextGallery });
      setUploadStatus("Gallery images uploaded and saved.");
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Gallery upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function removeGalleryImage(imageUrl: string) {
    const nextGallery = gallery.split("\n").map((item) => item.trim()).filter(Boolean).filter((item) => item !== imageUrl);
    setGallery(nextGallery.join("\n"));
    await onSiteUpdate({ ...site, gallery: nextGallery });
  }

  async function moveGalleryImage(index: number, direction: -1 | 1) {
    const currentGallery = gallery.split("\n").map((item) => item.trim()).filter(Boolean);
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= currentGallery.length) {
      return;
    }

    const nextGallery = [...currentGallery];
    [nextGallery[index], nextGallery[nextIndex]] = [nextGallery[nextIndex], nextGallery[index]];
    setGallery(nextGallery.join("\n"));
    await onSiteUpdate({ ...site, gallery: nextGallery });
  }

  async function useGalleryImageAsHero(imageUrl: string) {
    setHeroImageUrl(imageUrl);
    await onSiteUpdate({ ...site, heroImageUrl: imageUrl });
    setUploadStatus("Hero image updated from gallery.");
  }

  async function saveSection() {
    const nextFeatures = features.map((item) => item.trim()).filter(Boolean);

    if (editingSection === "Footer") {
      await onSiteUpdate({ ...site, name: footerName, location: footerLocation });
      setEditingSection(null);
      return;
    }

    await onSiteUpdate({
      ...site,
      heroTitle,
      heroSubtitle,
      heroImageUrl,
      heroCta,
      about,
      features: nextFeatures,
      gallery: gallery.split("\n").map((item) => item.trim()).filter(Boolean),
      experiences: experiences.split("\n").map((item) => item.trim()).filter(Boolean),
      bookingMessageTemplate,
    });
    setEditingSection(null);
  }

  return (
    <div className="grid gap-6">
      {!embedded ? (
      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Content</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{isLanding ? "Landing page sections" : "Page content"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {isLanding
                ? "Manage your one-page site with fixed business sections. Page URLs stay simple until you upgrade to Tree."
                : "Choose a public page, then manage the sections that appear on that page. Pages controls handle URL, SEO, and publish status."}
            </p>
          </div>
          <Badge tone={isLanding ? "sand" : "green"}>{isLanding ? "One-page" : "Page-based"}</Badge>
        </div>
      </Panel>
      ) : null}

      {!isLanding && !embedded ? (
        <Panel>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Select page</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Edit content by public page. Use Pages for publishing and SEO settings.</p>
            </div>
            <button type="button" onClick={() => onTabChange("structure")} className="min-h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
              Manage URLs & SEO
            </button>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {pages.map((page) => (
              <button
                key={page.key}
                type="button"
                onClick={() => {
                  setSelectedPageKey(page.key);
                  setEditingSection(null);
                }}
                className={`min-h-11 shrink-0 rounded-md px-4 text-sm font-semibold ring-1 ${
                  selectedPage.key === page.key ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-600 ring-slate-200"
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">{selectedPage.label}</p>
            <p className="mt-1 text-sm text-slate-600">{selectedPage.slug === "/" ? `/${site.slug}` : `/${site.slug}${selectedPage.slug}`}</p>
          </div>
        </Panel>
      ) : null}

      {editingSection ? (
        <Panel className="border-emerald-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Editing</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{editingSection}</h2>
            </div>
            <button type="button" onClick={() => setEditingSection(null)} className="text-sm font-semibold text-slate-600">
              Cancel
            </button>
          </div>
          <div className="mt-5 grid gap-4">
            {editingSection === "Hero" ? (
              <>
                <HeroImagePanel imageUrl={heroImageUrl} uploading={uploading === "hero"} onUpload={uploadHeroImage} />
                <EditableField label="Hero title" value={heroTitle} onChange={setHeroTitle} />
                <EditableField label="Hero subtitle" value={heroSubtitle} onChange={setHeroSubtitle} textarea />
                <EditableField label="CTA label" value={heroCta} onChange={setHeroCta} />
              </>
            ) : null}
            {editingSection === "About" ? <EditableField label="About copy" value={about} onChange={setAbout} textarea /> : null}
            {editingSection === "Features" ? <FeatureSelector features={features} onChange={setFeatures} /> : null}
            {editingSection === "Gallery" ? (
              <>
                <GalleryUploadPanel
                  gallery={gallery.split("\n").map((item) => item.trim()).filter(Boolean)}
                  uploading={uploading === "gallery"}
                  onUpload={uploadGalleryImages}
                  onRemove={removeGalleryImage}
                  onMove={moveGalleryImage}
                  onUseAsHero={useGalleryImageAsHero}
                />
              </>
            ) : null}
            {editingSection === "Experiences" ? <EditableField label="Experiences, one per line" value={experiences} onChange={setExperiences} textarea /> : null}
            {editingSection === "Inquiry CTA" ? <EditableField label="WhatsApp inquiry message template" value={bookingMessageTemplate} onChange={setBookingMessageTemplate} textarea rows={8} /> : null}
            {editingSection === "Footer" ? (
              <>
                <EditableField label="Business name" value={footerName} onChange={setFooterName} />
                <EditableField label="Footer location" value={footerLocation} onChange={setFooterLocation} />
              </>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => void saveSection()} className="min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white">
                Save changes
              </button>
            </div>
            {uploadStatus ? <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">{uploadStatus}</p> : null}
          </div>
        </Panel>
      ) : null}

      <div className={embedded ? "grid gap-4" : "grid gap-4 xl:grid-cols-2"}>
        {(isLanding ? landingBlocks() : selectedPage.blocks).map((section) => (
          <Panel key={section.title}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
                  <Badge tone={section.status === "Ready" ? "green" : section.status === "Needs review" ? "sand" : "gray"}>{section.status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (section.kind === "linked" && section.targetTab) {
                    onTabChange(section.targetTab);
                    return;
                  }

                  if (section.kind === "editable" && section.editTarget) {
                    startEditing(section.editTarget);
                  }
                }}
                disabled={section.kind === "comingSoon"}
                className={`min-h-11 rounded-md px-5 text-sm font-semibold ring-1 ${
                  editingSection === section.editTarget
                    ? "bg-slate-950 text-white ring-slate-950"
                    : section.kind === "comingSoon"
                      ? "cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200"
                    : "bg-white text-slate-950 ring-slate-200"
                }`}
              >
                {section.kind === "linked" ? "Open" : section.kind === "comingSoon" ? "Soon" : editingSection === section.editTarget ? "Editing" : "Edit"}
              </button>
            </div>
            {section.helper ? <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">{section.helper}</p> : null}
            {section.title === "Hero" ? (
              <div
                className="mt-5 overflow-hidden rounded-2xl bg-slate-950 text-white"
                style={site.heroImageUrl ? { backgroundImage: `linear-gradient(rgba(24, 53, 47, 0.72), rgba(24, 53, 47, 0.72)), url(${site.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              >
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Hero preview</p>
                  <h3 className="mt-3 text-2xl font-semibold">{site.heroTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{site.heroSubtitle}</p>
                  <span className="mt-4 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950">{site.heroCta}</span>
                </div>
              </div>
            ) : null}
            {section.title === "About" ? <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">{site.about}</p> : null}
            {section.title === "Features" ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {site.features.map((feature) => (
                  <span key={feature} className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-950">{feature}</span>
                ))}
              </div>
            ) : null}
            {section.title === "Offers" ? (
              <div className="mt-5 grid gap-3">
                {site.services.length > 0 ? site.services.slice(0, 3).map((service) => (
                  <div key={service.id} className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="sand">{service.kind}</Badge>
                      <p className="font-semibold text-slate-950">{service.title}</p>
                    </div>
                    {service.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p> : null}
                  </div>
                )) : <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-100">No services, packages, products, menu items, tours, or rooms yet.</p>}
              </div>
            ) : null}
            {section.title === "Reviews" ? (
              <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">Website testimonials are managed in the Reviews tab and can appear on the Reviews page or Home page.</p>
            ) : null}
            {section.title === "Promotions" ? (
              <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">Promotion content is managed in Offers and can be surfaced on the Promotions page.</p>
            ) : null}
            {section.title === "Blog" ? (
              <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">Blog authoring will be added after the page structure is stable.</p>
            ) : null}
            {section.title === "Experiences" ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {site.experiences.map((experience) => (
                  <span key={experience} className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{experience}</span>
                ))}
              </div>
            ) : null}
            {section.title === "Gallery" ? (
              <div className="mt-5 grid grid-cols-4 gap-2">
                {site.gallery.length > 0
                  ? site.gallery.slice(0, 8).map((imageUrl, index) => (
                      <div
                        key={imageUrl}
                        className="aspect-square rounded-xl bg-cover bg-center shadow-sm"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                        aria-label={`${site.name} gallery image ${index + 1}`}
                      />
                    ))
                  : Array.from({ length: 8 }, (_, index) => (
                      <div key={index} className="aspect-square rounded-xl bg-gradient-to-br from-slate-100 to-emerald-100" />
                    ))}
              </div>
            ) : null}
            {section.title === "Inquiry CTA" ? (
              <div className="mt-5 rounded-lg bg-slate-950 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">WhatsApp message</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/78">{site.bookingMessageTemplate}</p>
              </div>
            ) : null}
            {section.title === "Footer" ? (
              <div className="mt-5 rounded-lg bg-slate-950 p-5 text-white">
                <p className="text-sm font-semibold">{site.name}</p>
                <p className="mt-1 text-sm text-white/70">{site.location}</p>
              </div>
            ) : null}
          </Panel>
        ))}
      </div>
    </div>
  );
}

function HeroImagePanel({
  imageUrl,
  uploading,
  onUpload,
}: {
  imageUrl: string;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-950">Hero image</h3>
        <ImageUploadButton label={uploading ? "Uploading..." : "Upload hero image"} disabled={uploading} multiple={false} onUpload={(files) => {
          const file = files[0];
          if (file) {
            void onUpload(file);
          }
        }} />
      </div>
      {imageUrl ? (
        <div className="aspect-[16/9] rounded-2xl bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${imageUrl})` }} />
      ) : (
        <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-600">
          No hero image selected
        </div>
      )}
    </section>
  );
}

function GalleryUploadPanel({
  gallery,
  uploading,
  onUpload,
  onRemove,
  onMove,
  onUseAsHero,
}: {
  gallery: string[];
  uploading: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onRemove: (imageUrl: string) => Promise<void>;
  onMove: (index: number, direction: -1 | 1) => Promise<void>;
  onUseAsHero: (imageUrl: string) => Promise<void>;
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-950">Gallery images</h3>
        <ImageUploadButton label={uploading ? "Uploading..." : "Upload gallery"} disabled={uploading} multiple onUpload={onUpload} />
      </div>
      {gallery.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
              <div className="grid gap-2 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Image {index + 1}</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void onMove(index, -1)}
                      disabled={index === 0}
                      className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-950 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => void onMove(index, 1)}
                      disabled={index === gallery.length - 1}
                      className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-950 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Down
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void onUseAsHero(imageUrl)} className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Use as hero
                  </button>
                  <button type="button" onClick={() => void onRemove(imageUrl)} className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-600">
          No gallery images yet
        </div>
      )}
    </section>
  );
}

function ImageUploadButton({
  label,
  disabled,
  multiple,
  onUpload,
}: {
  label: string;
  disabled: boolean;
  multiple: boolean;
  onUpload: (files: File[]) => void;
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
      {label}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={disabled}
        multiple={multiple}
        onChange={(event) => {
          const files = event.target.files;
          const selectedFiles = files ? Array.from(files) : [];
          event.currentTarget.value = "";
          if (selectedFiles.length > 0) {
            onUpload(selectedFiles);
          }
        }}
        className="sr-only"
      />
    </label>
  );
}

function EditableField({
  label,
  value,
  onChange,
  textarea,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      {textarea ? (
        <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600" />
      )}
    </label>
  );
}
