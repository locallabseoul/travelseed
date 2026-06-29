import type { BusinessCategoryId } from "@/lib/business-categories";
import { isLegacyTemplate } from "@/lib/category-templates";
import type { ResortPlanType, ResortSiteType, ResortUpsert } from "@/types/resort";

export type TemplateCatalogEntry = {
  name: string;
  description: string;
  planType: ResortPlanType;
  siteType: ResortSiteType;
  templateId: string;
  previewImageUrl?: string;
  tags: [string, string];
  categoryIds: BusinessCategoryId[];
};

export const templateCatalog: TemplateCatalogEntry[] = [
  { name: "Hospitality Website", description: "Rooms, packages, amenities, location, and WhatsApp availability for resorts, villas, hotels, and stays.", planType: "seed", siteType: "landing", templateId: "minimal-stay", previewImageUrl: "/template-previews/tropical-villa-landing.svg", tags: ["Hospitality", "Seed"], categoryIds: ["accommodation"] },
  { name: "Cafe & Restaurant Website", description: "Menu highlights, set menus, reservations, catering, location, and WhatsApp table requests.", planType: "seed", siteType: "landing", templateId: "minimal-stay", previewImageUrl: "/template-previews/sunset-landing.svg", tags: ["Food", "Seed"], categoryIds: ["food"] },
  { name: "Tour Operator Website", description: "Tour packages, itinerary notes, pickup details, group planning, reviews, and WhatsApp availability.", planType: "seed", siteType: "landing", templateId: "minimal-stay", tags: ["Tours", "Seed"], categoryIds: ["tour"] },
  { name: "Local Services Website", description: "Products, services, delivery or pickup notes, consultation flow, customer proof, and quote requests.", planType: "seed", siteType: "landing", templateId: "minimal-stay", tags: ["Services", "Seed"], categoryIds: ["local_service"] },
  { name: "Wellness & Salon Website", description: "Treatments, packages, appointment details, staff notes, customer proof, and WhatsApp booking.", planType: "seed", siteType: "landing", templateId: "minimal-stay", tags: ["Wellness", "Seed"], categoryIds: ["wellness"] },
  { name: "Custom Business Platform", description: "Custom platform structure for premium campaigns, branches, special pages, and advanced operations.", planType: "forest", siteType: "custom", templateId: "minimal-stay", tags: ["Custom", "Forest"], categoryIds: ["accommodation", "food", "tour", "local_service", "wellness"] },
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

export function templateCatalogForCategory(categoryId: BusinessCategoryId, planType?: ResortPlanType) {
  return templateCatalog.filter((option) => (
    option.categoryIds.includes(categoryId) &&
    (planType ? canUsePlan(planType, option.planType) : true)
  ));
}

export function defaultTemplateCatalogEntryForCategory(categoryId: BusinessCategoryId, planType: ResortPlanType) {
  return templateCatalogForCategory(categoryId, planType)[0] ??
    templateCatalog.find((option) => option.categoryIds.includes(categoryId)) ??
    templateCatalog.find((option) => option.name === "Local Services Website") ??
    templateCatalog[0];
}

export function defaultTemplateCatalogNameFor(templateId: string, planType: ResortPlanType, categoryId?: BusinessCategoryId) {
  if (categoryId) {
    const categoryDefault = defaultTemplateCatalogEntryForCategory(categoryId, planType);

    if (categoryDefault?.templateId === templateId && canUsePlan(planType, categoryDefault.planType)) {
      return categoryDefault.name;
    }
  }

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

  if (existing && payload.template_id === existing.template_id && isLegacyTemplate(payload.template_id)) {
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
