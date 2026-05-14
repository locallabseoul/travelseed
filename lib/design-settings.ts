import type { ResortDesignSettings } from "@/types/resort";

export type DesignTokens = {
  colorTheme: string;
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
    logoUrl: settings?.logoUrl ?? "",
    fontStyle,
    buttonStyle,
    imageStyle,
    colors: palettes[colorTheme] ?? palettes["Tropical Green"],
    buttonClassName: buttonClassName(buttonStyle),
    imageClassName: imageClassName(imageStyle),
    headingClassName: headingClassName(fontStyle),
    bodyClassName: bodyClassName(fontStyle),
  };
}
