import { businessCategoryFromType, type BusinessCategory, type BusinessCategoryId, type BusinessCategoryInput } from "@/lib/business-categories";
import type { Resort, ResortTemplateId } from "@/types/resort";

export type CategoryTemplateId =
  | "category-hospitality"
  | "category-food"
  | "category-tour"
  | "category-local-service"
  | "category-wellness";

export type ResolvedCategoryTemplate = {
  mode: "category" | "legacy";
  category: BusinessCategory;
  categoryTemplateId: CategoryTemplateId;
  legacyTemplateId?: ResortTemplateId;
};

const categoryTemplateById: Record<BusinessCategoryId, CategoryTemplateId> = {
  accommodation: "category-hospitality",
  food: "category-food",
  tour: "category-tour",
  local_service: "category-local-service",
  wellness: "category-wellness",
};

const legacyTemplateIds = new Set(["boutique-villa", "boutique-resort", "surf-camp", "minimal-stay"]);
const legacyHospitalityRendererIds = new Set(["boutique-villa", "boutique-resort"]);

export function isLegacyTemplate(templateId: string | null | undefined) {
  return legacyTemplateIds.has(String(templateId ?? "").toLowerCase());
}

export function categoryTemplateForBusinessType(input: string | BusinessCategoryInput | Pick<Resort, "type" | "template_id"> | null | undefined) {
  return categoryTemplateById[businessCategoryFromType(input).id];
}

export function defaultTemplateIdForBusinessType(input: string | BusinessCategoryInput | Pick<Resort, "type" | "template_id"> | null | undefined) {
  void input;
  return "minimal-stay" satisfies ResortTemplateId;
}

export function resolveCategoryTemplate(resort: Resort, templateOverride?: string | null): ResolvedCategoryTemplate {
  const templateId = (templateOverride || resort.template_id || "").toLowerCase();
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });
  const categoryTemplateId = categoryTemplateById[category.id];

  if (category.id === "accommodation" && legacyHospitalityRendererIds.has(templateId)) {
    return {
      mode: "legacy",
      category,
      categoryTemplateId,
      legacyTemplateId: templateId as ResortTemplateId,
    };
  }

  return {
    mode: "category",
    category,
    categoryTemplateId,
  };
}
