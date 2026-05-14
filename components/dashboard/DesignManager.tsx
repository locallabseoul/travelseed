import { useEffect, useState } from "react";
import { colorThemes, templateOptions } from "@/components/dashboard/mockData";
import { Badge, Panel } from "@/components/dashboard/ui";
import { designTokensFor } from "@/lib/design-settings";
import type { ResortConsoleData } from "@/types/dashboard";

const fontOptions = ["Editorial Sans", "Clean Modern", "Warm Serif", "Compact UI"];
const buttonStyles = ["Rounded", "Pill", "Sharp", "Soft Outline"];
const imageStyles = ["Soft Corners", "Square Editorial", "Full Bleed", "Postcard"];

const templateIdByName: Record<string, string> = {
  "Boutique Villa": "boutique-villa",
  "Surf Camp": "surf-camp",
  "Minimal Stay": "minimal-stay",
  "Local Business": "minimal-stay",
};

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

export function DesignManager({
  site,
  onSiteUpdate,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
}) {
  const [template, setTemplate] = useState(site.template);
  const [colorTheme, setColorTheme] = useState(site.designSettings.colorTheme);
  const [logoUrl, setLogoUrl] = useState(site.designSettings.logoUrl);
  const [fontStyle, setFontStyle] = useState(site.designSettings.fontStyle);
  const [buttonStyle, setButtonStyle] = useState(site.designSettings.buttonStyle);
  const [imageStyle, setImageStyle] = useState(site.designSettings.imageStyle);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setTemplate(site.template);
    setColorTheme(site.designSettings.colorTheme);
    setLogoUrl(site.designSettings.logoUrl);
    setFontStyle(site.designSettings.fontStyle);
    setButtonStyle(site.designSettings.buttonStyle);
    setImageStyle(site.designSettings.imageStyle);
  }, [site.designSettings, site.template]);

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
        },
      });
      setStatus("Design settings saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save design settings.");
    }
  }

  const selectedTemplateName = templateNameById[template] ?? template;
  const selectedSwatches = themeSwatches[colorTheme] ?? themeSwatches["Tropical Green"];
  const previewDesign = designTokensFor({ colorTheme, logoUrl, fontStyle, buttonStyle, imageStyle });

  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Design</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Brand style</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Choose a guided template and practical brand settings for your direct booking site.</p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-4">
        {templateOptions.map((option) => {
          const templateId = templateIdByName[option.name] ?? option.name;
          const selected = templateId === template;
          return (
            <button key={option.name} type="button" onClick={() => setTemplate(templateId)} className="text-left">
              <Panel className={selected ? "h-full ring-2 ring-[#2d6b50]" : "h-full transition hover:ring-1 hover:ring-[#d8cebb]"}>
                <TemplatePreview name={option.name} />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-[#18352f]">{option.name}</h2>
                  {selected ? <Badge>Current</Badge> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{option.description}</p>
              </Panel>
            </button>
          );
        })}
      </div>

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
              <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{selectedTemplateName} · {colorTheme} · {fontStyle}</p>
            </div>
            <Badge>{buttonStyle}</Badge>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.48fr]">
            <div className={`overflow-hidden border border-[#eadfce] bg-white shadow-sm ${previewDesign.imageStyle === "Full Bleed" ? "rounded-none" : "rounded-2xl"}`}>
              <div className={`h-56 bg-cover bg-center ${previewDesign.imageClassName}`} style={site.heroImageUrl ? { backgroundImage: `url(${site.heroImageUrl})` } : { background: `linear-gradient(135deg, ${selectedSwatches[1]}, ${selectedSwatches[0]})` }} />
              <div className="p-5">
                {logoUrl ? <p className="text-xs font-semibold text-[#72815e]">Logo connected</p> : <p className="text-xs font-semibold text-[#72815e]">{site.type}</p>}
                <h3 className={`mt-2 text-3xl text-[#18352f] ${previewDesign.headingClassName}`}>{site.heroTitle || site.name}</h3>
                <p className={`mt-2 text-sm leading-6 text-[#6f7b74] ${previewDesign.bodyClassName}`}>{site.heroSubtitle || site.location}</p>
                <span
                  className={`mt-5 inline-flex min-h-11 items-center px-5 text-sm font-semibold ${previewDesign.buttonClassName}`}
                  style={{
                    backgroundColor: buttonStyle === "Soft Outline" ? "transparent" : selectedSwatches[2],
                    borderColor: selectedSwatches[2],
                    color: buttonStyle === "Soft Outline" ? selectedSwatches[2] : "#ffffff",
                  }}
                >
                  {site.heroCta}
                </span>
              </div>
            </div>
            <div className="mx-auto w-44 overflow-hidden rounded-[2rem] border-8 border-[#18352f] bg-white p-3 shadow-sm">
              <div className={`h-28 bg-cover bg-center ${previewDesign.imageClassName}`} style={site.heroImageUrl ? { backgroundImage: `url(${site.heroImageUrl})` } : { background: `linear-gradient(135deg, ${selectedSwatches[1]}, ${selectedSwatches[0]})` }} />
              <p className="mt-4 text-xs font-semibold text-[#72815e]">{selectedTemplateName}</p>
              <h3 className={`mt-1 text-lg text-[#18352f] ${previewDesign.headingClassName}`}>{site.name}</h3>
              <div
                className={`mt-4 h-9 ${previewDesign.buttonClassName}`}
                style={{
                  backgroundColor: buttonStyle === "Soft Outline" ? "transparent" : selectedSwatches[2],
                  borderColor: selectedSwatches[2],
                  borderWidth: buttonStyle === "Soft Outline" ? 2 : 0,
                }}
              />
            </div>
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
