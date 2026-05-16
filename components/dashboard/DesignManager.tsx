import { useEffect, useState } from "react";
import { colorThemes } from "@/components/dashboard/mockData";
import { canUsePlan, effectivePlanType, forestCustomPages, templateCatalog, treePages } from "@/components/dashboard/subscriptionConfig";
import { Badge, Panel } from "@/components/dashboard/ui";
import { designTokensFor } from "@/lib/design-settings";
import type { DesignTokens } from "@/lib/design-settings";
import { presetForSlug, presetSettingsFrom } from "@/lib/section-presets";
import type { DashboardUnsavedChanges, PlanType, ResortConsoleData } from "@/types/dashboard";

const fontOptions = ["Editorial Sans", "Clean Modern", "Warm Serif", "Compact UI"];
const buttonStyles = ["Rounded", "Pill", "Sharp", "Soft Outline"];
const imageStyles = ["Soft Corners", "Square Editorial", "Full Bleed", "Postcard"];

const templateNameById: Record<string, string> = {
  "boutique-villa": "Boutique Villa",
  "surf-camp": "Surf Camp",
  "minimal-stay": "Minimal Stay",
};

const themeSwatches: Record<string, string[]> = {
  Sand: ["#f8f5ef", "#d9c49e", "#18352f"],
  "Tropical Green": ["#f8f5ef", "#2d6b50", "#18352f"],
  "Dark Luxury": ["#11241f", "#d9c49e", "#ffffff"],
  "Minimal White": ["#ffffff", "#e7e1d6", "#202724"],
};

type PreviewMode = "boutique" | "surf" | "minimal" | "luxury";

type PresetPreviewItem = {
  label: string;
  title: string;
  slug: string;
  note: string;
};

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

  return "Upgrade to Seed to unlock one-page direct booking templates.";
}

function previewModeFor(templateId: string, catalogName: string): PreviewMode {
  if (templateId === "surf-camp") {
    return "surf";
  }

  if (templateId === "minimal-stay") {
    return "minimal";
  }

  if (catalogName.toLowerCase().includes("luxury")) {
    return "luxury";
  }

  return "boutique";
}

function defaultCatalogNameFor(templateId: string, planType: PlanType) {
  return templateCatalog.find((option) => option.templateId === templateId && canUsePlan(planType, option.planType))?.name ??
    templateCatalog.find((option) => option.templateId === templateId)?.name ??
    "";
}

function validCatalogNameFor(catalogName: string, templateId: string, planType: PlanType) {
  const savedCatalog = templateCatalog.find((option) => option.name === catalogName);

  if (savedCatalog && savedCatalog.templateId === templateId && canUsePlan(planType, savedCatalog.planType)) {
    return savedCatalog.name;
  }

  return defaultCatalogNameFor(templateId, planType);
}

function presetPreviewItemsFor(planType: PlanType): PresetPreviewItem[] {
  const pages = planType === "forest" ? forestCustomPages : treePages;

  return pages
    .map((page) => {
      const preset = presetForSlug(page.slug);

      if (!preset) {
        return null;
      }

      const settings = presetSettingsFrom(page.settings, preset);
      return {
        label: preset.label,
        title: settings.title,
        slug: preset.slug,
        note: preset.layout === "promotions"
          ? settings.campaignNote ?? "Direct booking campaign page."
          : preset.layout === "dining"
            ? settings.openingHours ?? "Dining details and guest meal highlights."
            : settings.items[0] ?? preset.description,
      };
    })
    .filter((item): item is PresetPreviewItem => Boolean(item))
    .slice(0, 6);
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
  const [template, setTemplate] = useState(site.template);
  const [templateCatalogName, setTemplateCatalogName] = useState(() => validCatalogNameFor(site.designSettings.templateCatalogName, site.template, effectivePlanType(site)));
  const [colorTheme, setColorTheme] = useState(site.designSettings.colorTheme);
  const [logoUrl, setLogoUrl] = useState(site.designSettings.logoUrl);
  const [fontStyle, setFontStyle] = useState(site.designSettings.fontStyle);
  const [buttonStyle, setButtonStyle] = useState(site.designSettings.buttonStyle);
  const [imageStyle, setImageStyle] = useState(site.designSettings.imageStyle);
  const [status, setStatus] = useState("");
  const planType = effectivePlanType(site);

  useEffect(() => {
    setTemplate(site.template);
    setTemplateCatalogName(validCatalogNameFor(site.designSettings.templateCatalogName, site.template, planType));
    setColorTheme(site.designSettings.colorTheme);
    setLogoUrl(site.designSettings.logoUrl);
    setFontStyle(site.designSettings.fontStyle);
    setButtonStyle(site.designSettings.buttonStyle);
    setImageStyle(site.designSettings.imageStyle);
  }, [planType, site.designSettings, site.template]);

  const isDirty = template !== site.template ||
    templateCatalogName !== validCatalogNameFor(site.designSettings.templateCatalogName, site.template, planType) ||
    colorTheme !== site.designSettings.colorTheme ||
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
          colorTheme,
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
  const previewDesign = designTokensFor({ colorTheme, logoUrl, fontStyle, buttonStyle, imageStyle });
  const availableTemplates = templateCatalog.filter((option) => canUsePlan(planType, option.planType));
  const upgradeTemplates = templateCatalog.filter((option) => !canUsePlan(planType, option.planType));
  const selectedCatalogEntry = templateCatalog.find((option) => option.name === templateCatalogName) ?? templateCatalog.find((option) => option.templateId === template);
  const selectedTemplateUnavailable = selectedCatalogEntry ? !canUsePlan(planType, selectedCatalogEntry.planType) : false;
  const previewMode = previewModeFor(template, selectedCatalogEntry?.name ?? selectedTemplateName);
  const presetPreviewItems = presetPreviewItemsFor(planType);

  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Design</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Brand style</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Choose a guided template and practical brand settings for your direct booking site.</p>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#18352f]">Template library</h2>
            <p className="mt-1 text-sm leading-6 text-[#6f7b74]">{templateLibraryCopy(planType)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="sand">{site.plan}</Badge>
            <Badge tone="green">Available for your plan</Badge>
          </div>
        </div>
        {selectedTemplateUnavailable ? (
          <p className="mt-4 rounded-2xl bg-[#fff7e8] p-4 text-sm leading-6 text-[#7b5b24]">
            The currently saved template belongs to a higher plan. Choose an available template before saving design settings.
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-4">
        {availableTemplates.length > 0 ? availableTemplates.map((option) => {
          const templateId = option.templateId;
          const selected = option.name === templateCatalogName;
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
              <Panel className={selected ? "h-full ring-2 ring-[#2d6b50]" : "h-full transition hover:ring-1 hover:ring-[#d8cebb]"}>
                <TemplatePreview name={option.name} />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-[#18352f]">{option.name}</h2>
                  {selected ? <Badge>Current</Badge> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{option.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="sand">{option.tags[0]}</Badge>
                  <Badge tone="gray">{option.tags[1]}</Badge>
                </div>
              </Panel>
            </button>
          );
        }) : (
          <Panel className="xl:col-span-4">
            <h2 className="text-xl font-semibold text-[#18352f]">No templates available on this plan yet</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Upgrade to Seed to unlock one-page direct booking templates.</p>
          </Panel>
        )}
      </div>

      {upgradeTemplates.length > 0 ? (
        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#18352f]">Upgrade templates</h2>
              <p className="mt-1 text-sm leading-6 text-[#6f7b74]">These templates require a higher plan and are shown as upgrade options only.</p>
            </div>
            <Badge tone="gray">Locked</Badge>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {upgradeTemplates.map((option) => (
              <article key={option.name} className="rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-[#18352f]">{option.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{option.description}</p>
                  </div>
                  <Badge tone="gray">{option.tags[1]}</Badge>
                </div>
                <p className="mt-4 text-xs font-semibold text-[#7b5b24]">Upgrade to {option.tags[1]} to use this template.</p>
                <button type="button" className="mt-4 min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
                  Upgrade to {option.tags[1]}
                </button>
              </article>
            ))}
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Brand controls</h2>
          <div className="mt-5 grid gap-6">
            <label className="grid gap-2 text-sm font-medium text-[#18352f]">
              Logo URL
              <input
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="https://..."
                className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]"
              />
            </label>

            <div>
              <p className="text-sm font-semibold text-[#18352f]">Color theme</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {colorThemes.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setColorTheme(theme)}
                    className={`min-h-16 rounded-xl bg-white p-3 text-left text-sm font-semibold text-[#18352f] ring-1 ${theme === colorTheme ? "ring-2 ring-[#2d6b50]" : "ring-[#eadfce]"}`}
                  >
                    <div className="mb-2 flex gap-1">
                      {(themeSwatches[theme] ?? []).map((swatch) => (
                        <span key={swatch} className="h-5 w-5 rounded-full ring-1 ring-black/5" style={{ backgroundColor: swatch }} />
                      ))}
                    </div>
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <SelectField label="Font style" value={fontStyle} options={fontOptions} onChange={setFontStyle} />
            <SelectField label="Button style" value={buttonStyle} options={buttonStyles} onChange={setButtonStyle} />
            <SelectField label="Image style" value={imageStyle} options={imageStyles} onChange={setImageStyle} />

            <button type="button" onClick={() => void saveDesignSettings()} className="min-h-12 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
              Save design settings
            </button>
            {status ? <p className="text-sm text-[#6f7b74]">{status}</p> : null}
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-xl font-semibold text-[#18352f]">Responsive preview</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{selectedCatalogEntry?.name ?? selectedTemplateName} · {colorTheme} · {fontStyle}</p>
            </div>
            <Badge>{buttonStyle}</Badge>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.48fr]">
            <DesktopPreview mode={previewMode} site={site} design={previewDesign} buttonStyle={buttonStyle} logoUrl={logoUrl} presets={presetPreviewItems} />
            <PhonePreview mode={previewMode} site={site} design={previewDesign} buttonStyle={buttonStyle} templateName={selectedCatalogEntry?.name ?? selectedTemplateName} presets={presetPreviewItems} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TemplatePreview({ name }: { name: string }) {
  if (name === "Surf Camp") {
    return <div className="aspect-[4/3] rounded-2xl bg-[linear-gradient(135deg,#0b5f6f,#f6d365)]" />;
  }

  if (name === "Minimal Stay") {
    return <div className="aspect-[4/3] rounded-2xl bg-[linear-gradient(135deg,#ffffff,#d8cebb)] ring-1 ring-[#eadfce]" />;
  }

  if (name === "Local Business") {
    return <div className="aspect-[4/3] rounded-2xl bg-[linear-gradient(135deg,#f8f5ef,#202724)]" />;
  }

  return <div className="aspect-[4/3] rounded-2xl bg-[linear-gradient(135deg,#eadfce,#f8f5ef,#2d6b50)]" />;
}

function PreviewButton({
  design,
  buttonStyle,
  label,
  className = "",
}: {
  design: DesignTokens;
  buttonStyle: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex min-h-10 items-center px-4 text-xs font-semibold ${design.buttonClassName} ${className}`}
      style={{
        backgroundColor: buttonStyle === "Soft Outline" ? "transparent" : design.colors.primary,
        borderColor: design.colors.primary,
        color: buttonStyle === "Soft Outline" ? design.colors.primary : design.colors.buttonText,
      }}
    >
      {label}
    </span>
  );
}

function PreviewImage({ site, design, className = "" }: { site: ResortConsoleData; design: DesignTokens; className?: string }) {
  return (
    <div
      className={`bg-cover bg-center ${design.imageClassName} ${className}`}
      style={site.heroImageUrl ? { backgroundImage: `url(${site.heroImageUrl})` } : { background: `linear-gradient(135deg, ${design.colors.accent}, ${design.colors.section})` }}
    />
  );
}

function DesktopPreview({
  mode,
  site,
  design,
  buttonStyle,
  logoUrl,
  presets,
}: {
  mode: PreviewMode;
  site: ResortConsoleData;
  design: DesignTokens;
  buttonStyle: string;
  logoUrl: string;
  presets: PresetPreviewItem[];
}) {
  if (mode === "surf") {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#eadfce] shadow-sm" style={{ backgroundColor: design.colors.primary, color: design.colors.buttonText }}>
        <div className="grid min-h-[360px] gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">{site.location}</p>
            <h3 className={`mt-3 text-4xl font-black leading-none ${design.headingClassName}`}>{site.heroTitle || site.name}</h3>
            <p className={`mt-4 text-sm leading-6 opacity-80 ${design.bodyClassName}`}>{site.heroSubtitle || "Active beach stays, packages, and direct booking in one clear flow."}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <PreviewButton design={design} buttonStyle={buttonStyle} label={site.heroCta} />
              <span className={`inline-flex min-h-10 items-center border border-white/35 px-4 text-xs font-semibold text-white ${design.buttonClassName}`}>Experiences</span>
            </div>
          </div>
          <div>
            <PreviewImage site={site} design={design} className="h-48 shadow-[0_24px_70px_rgba(0,0,0,0.24)]" />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["Rooms", "Lessons", "Pickup"].map((item) => (
                <div key={item} className="rounded-md bg-white/90 p-3 text-center text-xs font-black" style={{ color: design.colors.primary }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4" style={{ backgroundColor: design.colors.accent }}>
          {["Surf camp", "Packages", "Local rhythm"].map((item) => (
            <div key={item} className="rounded-md bg-white/20 px-3 py-2 text-xs font-bold text-white">{item}</div>
          ))}
        </div>
        <PresetPreviewStrip presets={presets} design={design} compact />
      </div>
    );
  }

  if (mode === "minimal") {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#eadfce] shadow-sm" style={{ backgroundColor: design.colors.page }}>
        <div className="grid min-h-[360px] gap-6 p-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>{site.location}</p>
            <h3 className={`mt-4 text-4xl font-semibold leading-tight ${design.headingClassName}`} style={{ color: design.colors.text }}>{site.heroTitle || site.name}</h3>
            <p className={`mt-4 text-sm leading-6 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>{site.heroSubtitle || "Quiet rooms, clean details, and direct booking without clutter."}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["2 guests", "Sea view", "Breakfast"].map((item) => (
                <span key={item} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: design.colors.accent, color: design.colors.muted }}>{item}</span>
              ))}
            </div>
          </div>
          <PreviewImage site={site} design={design} className="h-64" />
        </div>
        <div className="grid grid-cols-3 gap-3 border-t p-5" style={{ borderColor: design.colors.accent }}>
          {["Rooms", "Light", "Nearby"].map((item) => (
            <div key={item} className="border-t pt-3 text-xs font-medium" style={{ borderColor: design.colors.accent, color: design.colors.text }}>{item}</div>
          ))}
        </div>
        <PresetPreviewStrip presets={presets} design={design} />
      </div>
    );
  }

  if (mode === "luxury") {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#eadfce] shadow-sm" style={{ backgroundColor: design.colors.primary, color: design.colors.buttonText }}>
        <div className="grid min-h-[360px] gap-0 lg:grid-cols-[1fr_0.82fr]">
          <div className="p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: design.colors.accent }}>Custom resort platform</p>
            <h3 className={`mt-4 text-4xl font-semibold leading-tight ${design.headingClassName}`}>{site.heroTitle || site.name}</h3>
            <p className={`mt-4 max-w-sm text-sm leading-6 opacity-75 ${design.bodyClassName}`}>{site.heroSubtitle || "Premium campaign pages, direct booking, and editorial resort storytelling."}</p>
            <div className="mt-6">
              <PreviewButton design={design} buttonStyle={buttonStyle} label={site.heroCta} />
            </div>
          </div>
          <div className="p-4">
            <PreviewImage site={site} design={design} className="h-full min-h-72" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 border-t border-white/15 p-4">
          {["Weddings", "Dining", "Membership", "Offers"].map((item) => (
            <div key={item} className="rounded-md border border-white/15 p-3 text-xs font-semibold">{item}</div>
          ))}
        </div>
        <PresetPreviewStrip presets={presets} design={design} compact />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#eadfce] bg-white shadow-sm" style={{ backgroundColor: design.colors.page }}>
      <PreviewImage site={site} design={design} className="h-56" />
      <div className="p-5">
        {logoUrl ? <p className="text-xs font-semibold" style={{ color: design.colors.accent }}>Logo connected</p> : <p className="text-xs font-semibold" style={{ color: design.colors.accent }}>{site.type}</p>}
        <h3 className={`mt-2 text-3xl ${design.headingClassName}`} style={{ color: design.colors.text }}>{site.heroTitle || site.name}</h3>
        <p className={`mt-2 text-sm leading-6 ${design.bodyClassName}`} style={{ color: design.colors.muted }}>{site.heroSubtitle || site.location}</p>
        <div className="mt-5">
          <PreviewButton design={design} buttonStyle={buttonStyle} label={site.heroCta} />
        </div>
      </div>
      <PresetPreviewStrip presets={presets} design={design} />
    </div>
  );
}

function PresetPreviewStrip({
  presets,
  design,
  compact = false,
}: {
  presets: PresetPreviewItem[];
  design: DesignTokens;
  compact?: boolean;
}) {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="border-t p-4" style={{ backgroundColor: design.colors.section, borderColor: design.colors.accent }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: design.colors.accent }}>Preset pages</p>
        <span className="text-[11px] font-semibold" style={{ color: design.colors.muted }}>{presets.length} pages</span>
      </div>
      <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        {presets.slice(0, compact ? 4 : 6).map((preset) => (
          <div key={preset.slug} className="rounded-xl border px-3 py-2" style={{ backgroundColor: design.colors.page, borderColor: design.colors.accent }}>
            <p className="truncate text-xs font-semibold" style={{ color: design.colors.text }}>{preset.label}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4" style={{ color: design.colors.muted }}>{preset.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhonePreview({
  mode,
  site,
  design,
  buttonStyle,
  templateName,
  presets,
}: {
  mode: PreviewMode;
  site: ResortConsoleData;
  design: DesignTokens;
  buttonStyle: string;
  templateName: string;
  presets: PresetPreviewItem[];
}) {
  const isSurf = mode === "surf";
  const isMinimal = mode === "minimal";
  const isLuxury = mode === "luxury";

  return (
    <div className="mx-auto h-fit w-[268px] self-center rounded-[3rem] bg-[#111315] p-2.5 shadow-[0_24px_70px_rgba(17,19,21,0.24)] ring-1 ring-black/20">
      <div className="relative flex h-[548px] flex-col overflow-hidden rounded-[2.35rem] bg-white" style={{ backgroundColor: isSurf || isLuxury ? design.colors.primary : design.colors.page, color: isSurf || isLuxury ? design.colors.buttonText : design.colors.text }}>
        <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[#111315]" />
        <div className="flex h-8 items-end justify-between px-5 pb-1 text-[10px] font-semibold">
          <span>9:41</span>
          <span className="tracking-[0.08em]">5G</span>
        </div>
        {isMinimal ? (
          <div className="flex flex-1 flex-col p-4 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: design.colors.accent }}>{templateName}</p>
            <h3 className={`mt-2 text-xl leading-tight ${design.headingClassName}`}>{site.name}</h3>
            <PreviewImage site={site} design={design} className="mt-5 h-40" />
            <div className="mt-4 grid gap-2">
              {["Rooms", "Gallery", "Nearby"].map((item) => (
                <div key={item} className="border-t pt-2 text-[11px]" style={{ borderColor: design.colors.accent, color: design.colors.muted }}>{item}</div>
              ))}
            </div>
            <PhonePresetChips presets={presets} design={design} />
          </div>
        ) : (
          <>
            <PreviewImage site={site} design={design} className={isSurf ? "h-40" : "h-[9.75rem]"} />
            <div className="flex flex-1 flex-col p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: design.colors.accent }}>{templateName}</p>
              <h3 className={`mt-1 text-lg leading-tight ${design.headingClassName}`}>{site.name}</h3>
              <p className={`mt-2 line-clamp-2 text-[11px] leading-5 ${design.bodyClassName}`} style={{ color: isSurf || isLuxury ? "rgba(255,255,255,0.74)" : design.colors.muted }}>{site.heroSubtitle || site.location}</p>
              <div className={isSurf ? "mt-4 grid grid-cols-3 gap-1" : "mt-4"}>
                {isSurf ? ["Stay", "Surf", "Ride"].map((item) => (
                  <span key={item} className="rounded-md bg-white/15 px-2 py-2 text-center text-[9px] font-bold">{item}</span>
                )) : <PreviewButton design={design} buttonStyle={buttonStyle} label={isLuxury ? "Reserve" : "Book"} className="w-full justify-center" />}
              </div>
              <PhonePresetChips presets={presets} design={design} inverted={isSurf || isLuxury} />
            </div>
          </>
        )}
        <div className="mx-auto mb-2 mt-auto h-1 w-20 rounded-full bg-black/30" />
      </div>
    </div>
  );
}

function PhonePresetChips({
  presets,
  design,
  inverted = false,
}: {
  presets: PresetPreviewItem[];
  design: DesignTokens;
  inverted?: boolean;
}) {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex gap-1 overflow-hidden">
      {presets.slice(0, 3).map((preset) => (
        <span
          key={preset.slug}
          className="max-w-[72px] truncate rounded-full px-2 py-1 text-[9px] font-semibold"
          style={{
            backgroundColor: inverted ? "rgba(255,255,255,0.14)" : design.colors.section,
            color: inverted ? "rgba(255,255,255,0.82)" : design.colors.text,
          }}
        >
          {preset.label}
        </span>
      ))}
    </div>
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
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
