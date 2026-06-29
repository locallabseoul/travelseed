import type { ComponentType } from "react";
import { BoutiqueResortTemplate } from "@/components/templates/BoutiqueResortTemplate";
import { BoutiqueVillaTemplate } from "@/components/templates/BoutiqueVillaTemplate";
import { CategoryBusinessTemplate } from "@/components/templates/CategoryBusinessTemplate";
import { MinimalStayTemplate } from "@/components/templates/MinimalStayTemplate";
import { SurfCampTemplate } from "@/components/templates/SurfCampTemplate";
import { resolveCategoryTemplate } from "@/lib/category-templates";
import type { Resort, ResortTemplateId } from "@/types/resort";

type TemplateComponent = ComponentType<{ resort: Resort }>;

export const resortTemplateOptions: Array<{ id: ResortTemplateId; label: string }> = [
  { id: "minimal-stay", label: "Category website" },
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

// Resolves a legacy template id to a React component. New public rendering uses
// renderResortTemplate so the business category can take precedence.
export function getResortTemplate(templateId: string): TemplateComponent {
  return resortTemplateRegistry[templateId as ResortTemplateId] ?? CategoryBusinessTemplate;
}

// Renders new sites through category-first templates while keeping hospitality
// legacy renderers available for existing accommodation sites.
export function renderResortTemplate(resort: Resort, templateOverride?: string) {
  const resolved = resolveCategoryTemplate(resort, templateOverride);

  if (resolved.mode === "category") {
    return <CategoryBusinessTemplate resort={resort} />;
  }

  const templateId = resolved.legacyTemplateId;

  switch (templateId) {
    case "boutique-resort":
      return <BoutiqueResortTemplate resort={resort} />;
    case "boutique-villa":
    default:
      return <BoutiqueVillaTemplate resort={resort} />;
  }
}
