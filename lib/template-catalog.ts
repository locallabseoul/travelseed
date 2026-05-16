import type { ResortPlanType, ResortSiteType, ResortUpsert } from "@/types/resort";

export type TemplateCatalogEntry = {
  name: string;
  description: string;
  planType: ResortPlanType;
  siteType: ResortSiteType;
  templateId: string;
  tags: [string, string];
};

export const templateCatalog: TemplateCatalogEntry[] = [
  { name: "Sunset Landing", description: "A fast one-page direct booking site for small properties.", planType: "seed", siteType: "landing", templateId: "minimal-stay", tags: ["Landing", "Seed"] },
  { name: "Tropical Villa Landing", description: "Premium one-page villa presentation with booking CTA.", planType: "seed", siteType: "landing", templateId: "boutique-villa", tags: ["Landing", "Seed"] },
  { name: "Boutique Resort Multi-page", description: "Multi-page resort brand structure for rooms, dining, blog, and SEO.", planType: "tree", siteType: "multipage", templateId: "boutique-villa", tags: ["Multi-page", "Tree"] },
  { name: "Surf Camp Multi-page", description: "Activity-led multi-page site for camps, packages, and experiences.", planType: "tree", siteType: "multipage", templateId: "surf-camp", tags: ["Multi-page", "Tree"] },
  { name: "Luxury Resort Platform", description: "Custom platform structure for premium resort campaigns and special pages.", planType: "forest", siteType: "custom", templateId: "boutique-villa", tags: ["Custom", "Forest"] },
];

export function canUsePlan(current: ResortPlanType, required: ResortPlanType) {
  const order: ResortPlanType[] = ["freeTrial", "seed", "tree", "forest"];
  return order.indexOf(current) >= order.indexOf(required);
}

export function siteTypeForPlanType(planType: ResortPlanType): ResortSiteType {
  if (planType === "freeTrial" || planType === "seed") {
    return "landing";
  }

  if (planType === "forest") {
    return "custom";
  }

  return "multipage";
}

export function defaultTemplateCatalogNameFor(templateId: string, planType: ResortPlanType) {
  return templateCatalog.find((option) => option.templateId === templateId && canUsePlan(planType, option.planType))?.name ??
    templateCatalog.find((option) => option.templateId === templateId)?.name ??
    "";
}

function catalogNameFromPayload(payload: ResortUpsert) {
  const designSettings = payload.design_settings;

  if (designSettings && typeof designSettings === "object" && "templateCatalogName" in designSettings) {
    return typeof designSettings.templateCatalogName === "string" ? designSettings.templateCatalogName : "";
  }

  return "";
}

function catalogNameFromUnknown(settings: unknown) {
  if (settings && typeof settings === "object" && "templateCatalogName" in settings) {
    const catalogName = (settings as { templateCatalogName?: unknown }).templateCatalogName;
    return typeof catalogName === "string" ? catalogName : "";
  }

  return "";
}

export function validateTemplateEntitlement(payload: ResortUpsert, existing?: { template_id?: string | null; design_settings?: unknown }) {
  const planType = payload.plan_type ?? "tree";
  const expectedSiteType = siteTypeForPlanType(planType);

  if (payload.site_type !== expectedSiteType) {
    return `${payload.plan_type} sites must use ${expectedSiteType} site structure.`;
  }

  const catalogName = catalogNameFromPayload(payload);
  const existingCatalogName = catalogNameFromUnknown(existing?.design_settings);
  const unchangedExistingTemplate = Boolean(existing) &&
    payload.template_id === existing?.template_id &&
    catalogName === existingCatalogName;

  if (unchangedExistingTemplate) {
    return null;
  }

  if (catalogName) {
    const catalogEntry = templateCatalog.find((entry) => entry.name === catalogName);

    if (!catalogEntry) {
      return `Unknown template catalog selection: ${catalogName}.`;
    }

    if (catalogEntry.templateId !== payload.template_id) {
      return `${catalogName} must use template_id ${catalogEntry.templateId}.`;
    }

    if (!canUsePlan(planType, catalogEntry.planType)) {
      return `${catalogName} requires the ${catalogEntry.tags[1]} plan.`;
    }

    return null;
  }

  const accessibleFallback = templateCatalog.find((entry) => entry.templateId === payload.template_id && canUsePlan(planType, entry.planType));

  if (!accessibleFallback) {
    return `Template ${payload.template_id} is not available on the current plan.`;
  }

  return null;
}
