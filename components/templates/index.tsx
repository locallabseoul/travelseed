import type { ComponentType } from "react";
import { BoutiqueResortTemplate } from "@/components/templates/BoutiqueResortTemplate";
import { BoutiqueVillaTemplate } from "@/components/templates/BoutiqueVillaTemplate";
import { MinimalStayTemplate } from "@/components/templates/MinimalStayTemplate";
import { SurfCampTemplate } from "@/components/templates/SurfCampTemplate";
import type { Resort, ResortTemplateId } from "@/types/resort";

type TemplateComponent = ComponentType<{ resort: Resort }>;

export const resortTemplateOptions: Array<{ id: ResortTemplateId; label: string }> = [
  { id: "boutique-villa", label: "Boutique villa" },
  { id: "boutique-resort", label: "Boutique resort" },
  { id: "surf-camp", label: "Surf camp" },
  { id: "minimal-stay", label: "Minimal stay" },
];

export function isResortTemplateId(value: string): value is ResortTemplateId {
  return value in resortTemplateRegistry;
}

const resortTemplateRegistry: Record<ResortTemplateId, TemplateComponent> = {
  "boutique-villa": BoutiqueVillaTemplate,
  "boutique-resort": BoutiqueResortTemplate,
  "surf-camp": SurfCampTemplate,
  "minimal-stay": MinimalStayTemplate,
};

// Resolves a template id to a React component, falling back to the boutique villa layout.
export function getResortTemplate(templateId: string): TemplateComponent {
  return resortTemplateRegistry[templateId as ResortTemplateId] ?? BoutiqueVillaTemplate;
}

// Renders a resort through the matching registered template.
export function renderResortTemplate(resort: Resort, templateOverride?: string) {
  const templateId = templateOverride && isResortTemplateId(templateOverride) ? templateOverride : resort.template_id;

  switch (templateId) {
    case "boutique-resort":
      return <BoutiqueResortTemplate resort={resort} />;
    case "surf-camp":
      return <SurfCampTemplate resort={resort} />;
    case "minimal-stay":
      return <MinimalStayTemplate resort={resort} />;
    case "boutique-villa":
    default:
      return <BoutiqueVillaTemplate resort={resort} />;
  }
}
