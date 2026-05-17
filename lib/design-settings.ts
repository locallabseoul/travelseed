import type { ResortDesignSettings } from "@/types/resort";

export type DesignTokens = {
  colorTheme: string;
  customColors: ResortDesignSettings["customColors"];
  logoUrl: string;
  fontStyle: string;
  buttonStyle: string;
  imageStyle: string;
  colors: {
    page: string;
    section: string;
    primary: string;
    accent: string;
    text: string;
    muted: string;
    buttonText: string;
  };
  buttonClassName: string;
  imageClassName: string;
  headingClassName: string;
  bodyClassName: string;
};

export type TemplatePalette = {
  page: string;
  section: string;
  hero: string;
  primary: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
  border: string;
  inverseText: string;
  cta: string;
  ctaText: string;
};

export type TemplateEditableColors = Pick<TemplatePalette, "primary" | "accent" | "page" | "text">;

const palettes: Record<string, DesignTokens["colors"]> = {
  Sand: {
    page: "#f8f5ef",
    section: "#fbf8f1",
    primary: "#18352f",
    accent: "#d9c49e",
    text: "#18352f",
    muted: "#6b6a5f",
    buttonText: "#ffffff",
  },
  "Tropical Green": {
    page: "#f8f5ef",
    section: "#fbf8f1",
    primary: "#18352f",
    accent: "#2d6b50",
    text: "#18352f",
    muted: "#536159",
    buttonText: "#ffffff",
  },
  "Dark Luxury": {
    page: "#11241f",
    section: "#18352f",
    primary: "#d9c49e",
    accent: "#f4e6c8",
    text: "#f8f5ef",
    muted: "#d8cebb",
    buttonText: "#18352f",
  },
  "Minimal White": {
    page: "#ffffff",
    section: "#f8f6f0",
    primary: "#202724",
    accent: "#d8cebb",
    text: "#202724",
    muted: "#5b625e",
    buttonText: "#ffffff",
  },
};

const sunsetPalettes: Record<string, TemplatePalette> = {
  Sand: {
    page: "#fff9f5",
    section: "#f4e8d8",
    hero: "#2d3e50",
    primary: "#2d3e50",
    accent: "#d97c68",
    accentSoft: "#f4c7ad",
    text: "#2d3e50",
    muted: "rgba(45,62,80,0.68)",
    border: "rgba(217,124,104,0.26)",
    inverseText: "#ffffff",
    cta: "#d97c68",
    ctaText: "#ffffff",
  },
  "Tropical Green": {
    page: "#fff9f5",
    section: "#f4e8d8",
    hero: "#2d3e50",
    primary: "#2d3e50",
    accent: "#e85d75",
    accentSoft: "#ffb4a2",
    text: "#2d3e50",
    muted: "rgba(45,62,80,0.68)",
    border: "rgba(232,93,117,0.24)",
    inverseText: "#ffffff",
    cta: "#e85d75",
    ctaText: "#ffffff",
  },
  "Dark Luxury": {
    page: "#151b17",
    section: "#222b24",
    hero: "#0f1713",
    primary: "#f8f5ef",
    accent: "#d9c49e",
    accentSoft: "#8a6d4b",
    text: "#f8f5ef",
    muted: "rgba(248,245,239,0.68)",
    border: "rgba(217,196,158,0.24)",
    inverseText: "#151b17",
    cta: "#d9c49e",
    ctaText: "#151b17",
  },
  "Minimal White": {
    page: "#ffffff",
    section: "#f8f6f0",
    hero: "#202724",
    primary: "#202724",
    accent: "#8f7d68",
    accentSoft: "#d8cebb",
    text: "#202724",
    muted: "rgba(32,39,36,0.62)",
    border: "rgba(32,39,36,0.14)",
    inverseText: "#ffffff",
    cta: "#202724",
    ctaText: "#ffffff",
  },
};

const tropicalPalettes: Record<string, TemplatePalette> = {
  Sand: {
    page: "#f8f5ef",
    section: "#fbf8f1",
    hero: "#2f3327",
    primary: "#2f3327",
    accent: "#b18b4a",
    accentSoft: "#d9c49e",
    text: "#242820",
    muted: "#756f61",
    border: "rgba(47,51,39,0.16)",
    inverseText: "#f8f5ef",
    cta: "#b18b4a",
    ctaText: "#ffffff",
  },
  "Tropical Green": {
    page: "#f8f7f4",
    section: "#f8f7f4",
    hero: "#1b231d",
    primary: "#1b231d",
    accent: "#d4af37",
    accentSoft: "#8a6d4b",
    text: "#1b231d",
    muted: "#7a7a6c",
    border: "rgba(27,35,29,0.14)",
    inverseText: "#f8f7f4",
    cta: "#d4af37",
    ctaText: "#1b231d",
  },
  "Dark Luxury": {
    page: "#11241f",
    section: "#18352f",
    hero: "#0d1815",
    primary: "#11241f",
    accent: "#d9c49e",
    accentSoft: "#8a6d4b",
    text: "#f8f5ef",
    muted: "rgba(248,245,239,0.68)",
    border: "rgba(248,245,239,0.12)",
    inverseText: "#f8f5ef",
    cta: "#d9c49e",
    ctaText: "#11241f",
  },
  "Minimal White": {
    page: "#ffffff",
    section: "#f8f6f0",
    hero: "#202724",
    primary: "#202724",
    accent: "#7f8a76",
    accentSoft: "#d8cebb",
    text: "#202724",
    muted: "#5b625e",
    border: "rgba(32,39,36,0.14)",
    inverseText: "#ffffff",
    cta: "#202724",
    ctaText: "#ffffff",
  },
};

const boutiqueResortPalettes: Record<string, TemplatePalette> = {
  Sand: {
    page: "#0f172a",
    section: "#111827",
    hero: "#0f172a",
    primary: "#0f172a",
    accent: "#f97316",
    accentSoft: "#fed7aa",
    text: "#f5f5f4",
    muted: "rgba(231,229,228,0.72)",
    border: "rgba(255,255,255,0.10)",
    inverseText: "#f5f5f4",
    cta: "#f97316",
    ctaText: "#ffffff",
  },
  "Tropical Green": {
    page: "#0f172a",
    section: "#111827",
    hero: "#0f172a",
    primary: "#0f172a",
    accent: "#f97316",
    accentSoft: "#fed7aa",
    text: "#f5f5f4",
    muted: "rgba(231,229,228,0.72)",
    border: "rgba(255,255,255,0.10)",
    inverseText: "#f5f5f4",
    cta: "#f97316",
    ctaText: "#ffffff",
  },
  "Dark Luxury": {
    page: "#0b1120",
    section: "#0f172a",
    hero: "#020617",
    primary: "#0b1120",
    accent: "#d9c49e",
    accentSoft: "#8a6d4b",
    text: "#f8f5ef",
    muted: "rgba(248,245,239,0.70)",
    border: "rgba(217,196,158,0.18)",
    inverseText: "#f8f5ef",
    cta: "#d9c49e",
    ctaText: "#0b1120",
  },
  "Minimal White": {
    page: "#f8f6f0",
    section: "#ffffff",
    hero: "#202724",
    primary: "#202724",
    accent: "#f97316",
    accentSoft: "#fed7aa",
    text: "#202724",
    muted: "rgba(32,39,36,0.66)",
    border: "rgba(32,39,36,0.14)",
    inverseText: "#ffffff",
    cta: "#f97316",
    ctaText: "#ffffff",
  },
};

function customColor(settings: ResortDesignSettings | undefined, key: "primary" | "accent" | "page" | "text") {
  const value = settings?.customColors?.[key]?.trim();
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const next = value / 255;
    return next <= 0.03928 ? next / 12.92 : ((next + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function readableTextOn(background: string) {
  return relativeLuminance(background) > 0.62 ? "#18352f" : "#ffffff";
}

function rgbaFromHex(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function applyCustomTokenColors(colors: DesignTokens["colors"], settings?: ResortDesignSettings): DesignTokens["colors"] {
  const primary = customColor(settings, "primary") ?? colors.primary;
  const accent = customColor(settings, "accent") ?? colors.accent;
  const page = customColor(settings, "page") ?? colors.page;
  const text = customColor(settings, "text") ?? colors.text;

  return {
    ...colors,
    page,
    section: customColor(settings, "page") ? page : colors.section,
    primary,
    accent,
    text,
    muted: customColor(settings, "text") ? rgbaFromHex(text, 0.68) : colors.muted,
    buttonText: readableTextOn(primary),
  };
}

function applyCustomTemplatePalette(palette: TemplatePalette, settings?: ResortDesignSettings): TemplatePalette {
  const primary = customColor(settings, "primary") ?? palette.primary;
  const accent = customColor(settings, "accent") ?? palette.accent;
  const page = customColor(settings, "page") ?? palette.page;
  const text = customColor(settings, "text") ?? palette.text;
  const cta = customColor(settings, "accent") ?? palette.cta;

  return {
    ...palette,
    page,
    section: customColor(settings, "page") ? page : palette.section,
    hero: customColor(settings, "primary") ? primary : palette.hero,
    primary,
    accent,
    accentSoft: customColor(settings, "accent") ? rgbaFromHex(accent, 0.28) : palette.accentSoft,
    text,
    muted: customColor(settings, "text") ? rgbaFromHex(text, 0.68) : palette.muted,
    border: customColor(settings, "accent") ? rgbaFromHex(accent, 0.24) : palette.border,
    inverseText: readableTextOn(primary),
    cta,
    ctaText: readableTextOn(cta),
  };
}

function buttonClassName(style: string) {
  if (style === "Sharp") {
    return "rounded-none uppercase tracking-[0.16em]";
  }

  if (style === "Soft Outline") {
    return "rounded-xl border-2 bg-transparent";
  }

  if (style === "Rounded") {
    return "rounded-xl shadow-sm";
  }

  return "rounded-full shadow-sm";
}

function imageClassName(style: string) {
  if (style === "Square Editorial") {
    return "rounded-none";
  }

  if (style === "Full Bleed") {
    return "rounded-none shadow-none";
  }

  if (style === "Postcard") {
    return "rounded-md border-8 border-white shadow-[0_24px_80px_rgba(52,43,31,0.12)]";
  }

  return "rounded-2xl shadow-sm";
}

function headingClassName(style: string) {
  if (style === "Warm Serif") {
    return "font-serif tracking-normal";
  }

  if (style === "Clean Modern") {
    return "font-sans font-medium tracking-normal";
  }

  if (style === "Compact UI") {
    return "font-sans font-bold tracking-tight";
  }

  return "font-sans font-semibold tracking-wide";
}

function bodyClassName(style: string) {
  if (style === "Compact UI") {
    return "text-sm leading-6";
  }

  if (style === "Warm Serif") {
    return "font-serif";
  }

  return "";
}

export function designTokensFor(settings?: ResortDesignSettings): DesignTokens {
  const colorTheme = settings?.colorTheme ?? "Tropical Green";
  const fontStyle = settings?.fontStyle ?? "Editorial Sans";
  const buttonStyle = settings?.buttonStyle ?? "Pill";
  const imageStyle = settings?.imageStyle ?? "Soft Corners";

  return {
    colorTheme,
    customColors: settings?.customColors ?? {},
    logoUrl: settings?.logoUrl ?? "",
    fontStyle,
    buttonStyle,
    imageStyle,
    colors: applyCustomTokenColors(palettes[colorTheme] ?? palettes["Tropical Green"], settings),
    buttonClassName: buttonClassName(buttonStyle),
    imageClassName: imageClassName(imageStyle),
    headingClassName: headingClassName(fontStyle),
    bodyClassName: bodyClassName(fontStyle),
  };
}

export function templatePaletteFor(templateId: string, settings?: ResortDesignSettings): TemplatePalette {
  const colorTheme = settings?.colorTheme ?? "Tropical Green";

  if (templateId === "minimal-stay" || settings?.templateCatalogName?.toLowerCase().includes("sunset")) {
    return applyCustomTemplatePalette(sunsetPalettes[colorTheme] ?? sunsetPalettes["Tropical Green"], settings);
  }

  if (templateId === "boutique-villa" || settings?.templateCatalogName?.toLowerCase().includes("tropical")) {
    return applyCustomTemplatePalette(tropicalPalettes[colorTheme] ?? tropicalPalettes["Tropical Green"], settings);
  }

  if (templateId === "boutique-resort" || settings?.templateCatalogName?.toLowerCase().includes("boutique resort")) {
    return applyCustomTemplatePalette(boutiqueResortPalettes[colorTheme] ?? boutiqueResortPalettes["Tropical Green"], settings);
  }

  const base = applyCustomTokenColors(palettes[colorTheme] ?? palettes["Tropical Green"], settings);
  return applyCustomTemplatePalette({
    page: base.page,
    section: base.section,
    hero: base.primary,
    primary: base.primary,
    accent: base.accent,
    accentSoft: base.section,
    text: base.text,
    muted: base.muted,
    border: `${base.accent}55`,
    inverseText: base.buttonText,
    cta: base.primary,
    ctaText: base.buttonText,
  }, settings);
}

export function defaultEditableColorsForTemplate(templateId: string, settings?: ResortDesignSettings): TemplateEditableColors {
  const palette = templatePaletteFor(templateId, {
    ...settings,
    colorTheme: "Tropical Green",
    customColors: undefined,
  });

  return {
    primary: palette.primary,
    accent: palette.accent,
    page: palette.page,
    text: palette.text,
  };
}
