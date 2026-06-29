import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { canUsePlan, defaultTemplateCatalogEntryForCategory, effectivePlanType, templateCatalog, templateCatalogForCategory } from "@/components/dashboard/subscriptionConfig";
import { Badge, Panel } from "@/components/dashboard/ui";
import { savePreviewResort } from "@/components/create/preview-storage";
import { businessCategoryFromType, type BusinessCategoryId } from "@/lib/business-categories";
import { dashboardCategoryCopyFor } from "@/lib/dashboard-category-copy";
import { defaultEditableColorsForTemplate } from "@/lib/design-settings";
import type { DashboardUnsavedChanges, PlanType, ResortConsoleData } from "@/types/dashboard";
import type { Resort } from "@/types/resort";

const fontOptions = ["Editorial Sans", "Clean Modern", "Warm Serif", "Compact UI"];
const buttonStyles = ["Rounded", "Pill", "Sharp", "Soft Outline"];
const imageStyles = ["Soft Corners", "Square Editorial", "Full Bleed", "Postcard"];

const templateNameById: Record<string, string> = {
  "boutique-villa": "Legacy Hospitality",
  "boutique-resort": "Legacy Hospitality Multi-page",
  "surf-camp": "Legacy Tour",
  "minimal-stay": "Category Website",
};

const colorControlLabels = {
  primary: "Primary",
  accent: "Accent",
  page: "Background",
  text: "Text",
} satisfies Record<ColorControlKey, string>;

type ColorControlKey = "primary" | "accent" | "page" | "text";
type CustomColors = ResortConsoleData["designSettings"]["customColors"];

function isHexColor(value: string | undefined) {
  return !!value && /^#[0-9a-f]{6}$/i.test(value);
}

function templateLibraryCopy(planType: PlanType) {
  if (planType === "seed") {
    return "One-page templates available on your plan.";
  }

  if (planType === "tree") {
    return "Landing and multi-page templates available on your plan.";
  }

  if (planType === "forest") {
    return "All templates are available on your plan.";
  }

  return "Upgrade to Seed to unlock one-page WhatsApp-ready business templates.";
}

function defaultCatalogNameFor(templateId: string, planType: PlanType, categoryId: BusinessCategoryId) {
  const categoryDefault = defaultTemplateCatalogEntryForCategory(categoryId, planType);

  if (categoryDefault?.templateId === templateId && canUsePlan(planType, categoryDefault.planType)) {
    return categoryDefault.name;
  }

  return templateCatalog.find((option) => option.templateId === templateId && option.categoryIds.includes(categoryId) && canUsePlan(planType, option.planType))?.name ??
    templateCatalog.find((option) => option.templateId === templateId)?.name ??
    "";
}

function validCatalogNameFor(catalogName: string, templateId: string, planType: PlanType, categoryId: BusinessCategoryId) {
  const savedCatalog = templateCatalog.find((option) => option.name === catalogName);

  if (savedCatalog && savedCatalog.templateId === templateId && savedCatalog.categoryIds.includes(categoryId) && canUsePlan(planType, savedCatalog.planType)) {
    return savedCatalog.name;
  }

  return defaultCatalogNameFor(templateId, planType, categoryId);
}

function normalizedCustomColors(colors: CustomColors) {
  return {
    ...(isHexColor(colors.primary) ? { primary: colors.primary } : {}),
    ...(isHexColor(colors.accent) ? { accent: colors.accent } : {}),
    ...(isHexColor(colors.page) ? { page: colors.page } : {}),
    ...(isHexColor(colors.text) ? { text: colors.text } : {}),
  };
}

function customColorsEqual(left: CustomColors, right: CustomColors) {
  return JSON.stringify(normalizedCustomColors(left)) === JSON.stringify(normalizedCustomColors(right));
}

export function DesignManager({
  site,
  onSiteUpdate,
  onUnsavedChangesChange,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
}) {
  const planType = effectivePlanType(site);
  const category = businessCategoryFromType({ type: site.type, templateId: site.template });
  const [template, setTemplate] = useState(site.template);
  const [templateCatalogName, setTemplateCatalogName] = useState(() => validCatalogNameFor(site.designSettings.templateCatalogName, site.template, planType, category.id));
  const [customColors, setCustomColors] = useState<CustomColors>(site.designSettings.customColors);
  const [logoUrl, setLogoUrl] = useState(site.designSettings.logoUrl);
  const [fontStyle, setFontStyle] = useState(site.designSettings.fontStyle);
  const [buttonStyle, setButtonStyle] = useState(site.designSettings.buttonStyle);
  const [imageStyle, setImageStyle] = useState(site.designSettings.imageStyle);
  const [status, setStatus] = useState("");
  const [previewRevision, setPreviewRevision] = useState(0);
  const dashboardCopy = dashboardCategoryCopyFor(site);

  useEffect(() => {
    setTemplate(site.template);
    setTemplateCatalogName(validCatalogNameFor(site.designSettings.templateCatalogName, site.template, planType, category.id));
    setCustomColors(site.designSettings.customColors);
    setLogoUrl(site.designSettings.logoUrl);
    setFontStyle(site.designSettings.fontStyle);
    setButtonStyle(site.designSettings.buttonStyle);
    setImageStyle(site.designSettings.imageStyle);
  }, [category.id, planType, site.designSettings, site.template]);

  const isDirty = template !== site.template ||
    templateCatalogName !== validCatalogNameFor(site.designSettings.templateCatalogName, site.template, planType, category.id) ||
    !customColorsEqual(customColors, site.designSettings.customColors) ||
    logoUrl !== site.designSettings.logoUrl ||
    fontStyle !== site.designSettings.fontStyle ||
    buttonStyle !== site.designSettings.buttonStyle ||
    imageStyle !== site.designSettings.imageStyle;

  useEffect(() => {
    onUnsavedChangesChange?.({
      isDirty,
      title: "Discard design changes?",
      description: "You have design settings that have not been saved. Continue without saving them?",
    });

    return () => onUnsavedChangesChange?.({ isDirty: false, title: "", description: "" });
  }, [isDirty, onUnsavedChangesChange]);

  async function saveDesignSettings() {
    setStatus("Saving design settings...");
    try {
      await onSiteUpdate({
        ...site,
        template,
        designSettings: {
          colorTheme: site.designSettings.colorTheme || "Tropical Green",
          customColors: normalizedCustomColors(customColors),
          logoUrl,
          fontStyle,
          buttonStyle,
          imageStyle,
          templateCatalogName,
        },
      });
      setStatus("Design settings saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save design settings.");
    }
  }

  const selectedTemplateName = templateNameById[template] ?? template;
  const recommendedTemplateNames = new Set(dashboardCopy.design.recommendedTemplateNames);
  const availableTemplates = templateCatalogForCategory(category.id)
    .filter((option) => canUsePlan(planType, option.planType))
    .sort((left, right) => Number(recommendedTemplateNames.has(right.name)) - Number(recommendedTemplateNames.has(left.name)));
  const upgradeTemplates = templateCatalogForCategory(category.id).filter((option) => !canUsePlan(planType, option.planType));
  const selectedCatalogEntry = templateCatalog.find((option) => option.name === templateCatalogName) ??
    templateCatalog.find((option) => option.templateId === template && option.categoryIds.includes(category.id));
  const selectedTemplateUnavailable = selectedCatalogEntry ? !canUsePlan(planType, selectedCatalogEntry.planType) : false;
  const savedColorTheme = site.designSettings.colorTheme || "Tropical Green";
  const previewResort = useMemo(
    () => previewResortFromSite(site, {
      template,
      colorTheme: savedColorTheme,
      customColors: normalizedCustomColors(customColors),
      logoUrl,
      fontStyle,
      buttonStyle,
      imageStyle,
      templateCatalogName,
    }),
    [buttonStyle, customColors, fontStyle, imageStyle, logoUrl, savedColorTheme, site, template, templateCatalogName],
  );

  const templateDefaultColors = defaultEditableColorsForTemplate(template, { templateCatalogName });
  const editableColors = {
    primary: customColors.primary ?? templateDefaultColors.primary,
    accent: customColors.accent ?? templateDefaultColors.accent,
    page: customColors.page ?? templateDefaultColors.page,
    text: customColors.text ?? templateDefaultColors.text,
  } satisfies Record<ColorControlKey, string>;
  const isCustomColorMode = Object.keys(normalizedCustomColors(customColors)).length > 0;

  useEffect(() => {
    savePreviewResort(previewResort);
    setPreviewRevision((current) => current + 1);
  }, [previewResort]);

  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Design</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Brand style</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Choose a guided template and practical brand settings for your WhatsApp-ready business site.</p>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Template library</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{templateLibraryCopy(planType)} {dashboardCopy.design.recommendation}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="sand">{site.plan}</Badge>
            <Badge tone="green">Available for your plan</Badge>
          </div>
        </div>
        {selectedTemplateUnavailable ? (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-700">
            The currently saved template belongs to a higher plan. Choose an available template before saving design settings.
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-4">
        {availableTemplates.length > 0 ? availableTemplates.map((option) => {
          const templateId = option.templateId;
          const selected = option.name === templateCatalogName;
          const recommended = recommendedTemplateNames.has(option.name);
          return (
            <button
              key={option.name}
              type="button"
              onClick={() => {
                setTemplate(templateId);
                setTemplateCatalogName(option.name);
              }}
              className="text-left"
            >
              <Panel className={selected ? "h-full ring-2 ring-emerald-500" : "h-full transition hover:ring-1 hover:ring-slate-200"}>
                <TemplatePreview name={option.name} previewImageUrl={option.previewImageUrl} />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-slate-950">{option.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    {recommended ? <Badge tone="green">Recommended</Badge> : null}
                    {selected ? <Badge>Current</Badge> : null}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="sand">{option.tags[0]}</Badge>
                  <Badge tone="gray">{option.tags[1]}</Badge>
                </div>
              </Panel>
            </button>
          );
        }) : (
          <Panel className="xl:col-span-4">
            <h2 className="text-xl font-semibold text-slate-950">No templates available on this plan yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Upgrade to Seed to unlock one-page WhatsApp-ready business templates.</p>
          </Panel>
        )}
      </div>

      {upgradeTemplates.length > 0 ? (
        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Upgrade templates</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">These templates require a higher plan and are shown as upgrade options only.</p>
            </div>
            <Badge tone="gray">Locked</Badge>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {upgradeTemplates.map((option) => (
              <article key={option.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{option.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                  </div>
                  <Badge tone="gray">{option.tags[1]}</Badge>
                </div>
                <p className="mt-4 text-xs font-semibold text-amber-700">Upgrade to {option.tags[1]} to use this template.</p>
                <button type="button" className="mt-4 min-h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
                  Upgrade to {option.tags[1]}
                </button>
              </article>
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <h2 className="text-xl font-semibold text-slate-950">Brand controls</h2>
          <div className="mt-5 grid gap-6">
            <label className="grid gap-2 text-sm font-medium text-slate-950">
              Logo URL
                <input
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://..."
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Customize colors</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {isCustomColorMode ? "Custom colors override this template's default palette." : "Using this template's default palette."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomColors({})}
                  className="min-h-9 rounded-md bg-white px-3 text-xs font-semibold text-slate-950 ring-1 ring-slate-200"
                >
                  Reset
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                {(Object.keys(colorControlLabels) as ColorControlKey[]).map((key) => (
                  <ColorField
                    key={key}
                    label={colorControlLabels[key]}
                    value={editableColors[key]}
                    onChange={(value) => setCustomColors((current) => ({ ...current, [key]: value }))}
                  />
                ))}
              </div>
            </div>

            <SelectField label="Font style" value={fontStyle} options={fontOptions} onChange={setFontStyle} />
            <SelectField label="Button style" value={buttonStyle} options={buttonStyles} onChange={setButtonStyle} />
            <SelectField label="Image style" value={imageStyle} options={imageStyles} onChange={setImageStyle} />

            <button type="button" onClick={() => void saveDesignSettings()} className="min-h-12 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white">
              Save design settings
            </button>
            {status ? <p className="text-sm text-slate-600">{status}</p> : null}
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Responsive preview</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selectedCatalogEntry?.name ?? selectedTemplateName} · {isCustomColorMode ? "Custom colors" : "Template default colors"} · {fontStyle}</p>
            </div>
            <Badge>{buttonStyle}</Badge>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.48fr]">
            <DesktopPreview revision={previewRevision} />
            <PhonePreview revision={previewRevision} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TemplatePreview({ name, previewImageUrl }: { name: string; previewImageUrl?: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (previewImageUrl && !imageFailed) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
        <Image
          src={previewImageUrl}
          alt={`${name} template preview`}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  if (name.toLowerCase().includes("surf")) {
    return <div className="aspect-[4/3] rounded-lg bg-[linear-gradient(135deg,#0b5f6f,#f6d365)]" aria-label={`${name} template preview`} />;
  }

  if (name.toLowerCase().includes("sunset") || name.toLowerCase().includes("minimal") || name.toLowerCase().includes("local business") || name.toLowerCase().includes("cafe")) {
    return <div className="aspect-[4/3] rounded-lg bg-[linear-gradient(135deg,#f8fafc,#a7f3d0,#0f172a)] ring-1 ring-slate-200" aria-label={`${name} template preview`} />;
  }

  if (name.toLowerCase().includes("luxury") || name.toLowerCase().includes("custom business")) {
    return <div className="aspect-[4/3] rounded-lg bg-[linear-gradient(135deg,#151b17,#8a6d4b,#d4af37)]" aria-label={`${name} template preview`} />;
  }

  if (name.toLowerCase().includes("boutique resort")) {
    return <div className="aspect-[4/3] rounded-lg bg-[linear-gradient(135deg,#0f172a,#1e293b,#f97316)] ring-1 ring-slate-200" aria-label={`${name} template preview`} />;
  }

  return <div className="aspect-[4/3] rounded-lg bg-[linear-gradient(135deg,#f8fafc,#e2e8f0,#22c55e)]" aria-label={`${name} template preview`} />;
}

function DesktopPreview({ revision }: { revision: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="relative h-[585px] overflow-hidden bg-slate-100">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[1230px] w-[1440px] origin-top -translate-x-1/2 scale-[0.475] [transform-style:preserve-3d]">
          <iframe
            key={`desktop-${revision}`}
            src={revision > 0 ? `/preview?dashboardPreview=${revision}&viewport=desktop` : "about:blank"}
            title="Desktop template preview"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}

function PhonePreview({ revision }: { revision: number }) {
  return (
    <div className="mx-auto h-fit w-[268px] self-center rounded-[3rem] bg-[#111315] p-2.5 shadow-[0_24px_70px_rgba(17,19,21,0.24)] ring-1 ring-black/20">
      <div className="relative h-[548px] overflow-hidden rounded-[2.35rem] bg-white">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[#111315]" />
        <div className="pointer-events-none absolute left-0 top-0 z-20 flex h-8 w-full items-end justify-between px-5 pb-1 text-[10px] font-semibold text-white mix-blend-difference">
          <span>9:41</span>
          <span className="tracking-[0.08em]">5G</span>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-8 h-[760px] w-[390px] origin-top -translate-x-1/2 scale-[0.636] [transform-style:preserve-3d]">
          <iframe
            key={`phone-${revision}`}
            src={revision > 0 ? `/preview?dashboardPreview=${revision}&viewport=phone` : "about:blank"}
            title="Phone template preview"
            className="h-full w-full border-0"
          />
        </div>
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 h-1 w-20 -translate-x-1/2 rounded-full bg-black/30" />
      </div>
    </div>
  );
}

function previewResortFromSite(
  site: ResortConsoleData,
  design: ResortConsoleData["designSettings"] & { template: string },
): Resort {
  return {
    id: site.id,
    owner_user_id: null,
    owner_email: site.contactEmail || null,
    slug: site.slug,
    name: site.name,
    domain: site.domain,
    template_id: design.template,
    plan: site.plan,
    plan_type: site.planType,
    site_type: site.siteType,
    location: site.location,
    type: site.type,
    description: site.about || null,
    hero_title: site.heroTitle || site.name,
    hero_subtitle: site.heroSubtitle || null,
    hero_image_url: site.heroImageUrl || null,
    whatsapp_number: site.whatsappNumber,
    capacity: null,
    bedrooms: null,
    bathrooms: null,
    features: site.features,
    gallery: site.gallery,
    experiences: site.experiences,
    booking_message_template: site.bookingMessageTemplate || null,
    design_settings: {
      colorTheme: design.colorTheme,
      customColors: design.customColors,
      logoUrl: design.logoUrl,
      fontStyle: design.fontStyle,
      buttonStyle: design.buttonStyle,
      imageStyle: design.imageStyle,
      templateCatalogName: design.templateCatalogName,
    },
    is_active: site.isActive,
    domain_status: site.domainStatus,
    ssl_status: site.sslStatus,
    domain_verified_at: site.domainVerifiedAt,
    services: site.services.map((service) => ({
      id: service.id,
      resort_id: site.id,
      kind: service.kind,
      title: service.title,
      description: service.description || null,
      price_label: service.priceLabel || null,
      capacity: numberFromString(service.capacity),
      image_url: service.imageUrl || null,
      highlight: service.highlight || null,
      duration: service.duration || null,
      included: service.included,
      cta_label: service.ctaLabel || null,
      bed_type: service.bedType || null,
      room_size: service.roomSize || null,
      view_type: service.viewType || null,
      bathroom_info: service.bathroomInfo || null,
      max_guests: numberFromString(service.maxGuests),
      room_amenities: service.roomAmenities,
      sort_order: service.sortOrder,
      is_active: service.isActive,
    })),
    reviews: [],
    pages: [],
    sections: [],
    navigation_items: [],
    created_at: site.createdAt,
    updated_at: site.updatedAt,
  };
}

function numberFromString(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const colorPickerValue = isHexColor(value) ? value : "#000000";

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      <div className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
        <input
          type="color"
          value={colorPickerValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
          aria-label={`${label} color picker`}
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={7}
          placeholder="#0f172a"
          className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase outline-none"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
