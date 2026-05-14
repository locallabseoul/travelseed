import type { FeaturePresetInput } from "@/types/feature-preset";

export function sanitizeFeaturePresetPayload(payload: Partial<FeaturePresetInput>): FeaturePresetInput {
  return {
    label: String(payload.label ?? "").trim(),
    category: String(payload.category ?? "General").trim() || "General",
    icon: String(payload.icon ?? "sparkle").trim() || "sparkle",
    property_types: Array.isArray(payload.property_types)
      ? payload.property_types.map((item) => String(item).trim()).filter(Boolean)
      : [],
    sort_order: Number.isFinite(Number(payload.sort_order)) ? Number(payload.sort_order) : 0,
    is_active: payload.is_active ?? true,
  };
}

export function validateFeaturePresetPayload(payload: FeaturePresetInput) {
  if (!payload.label) {
    return "Feature label is required.";
  }

  if (!payload.category) {
    return "Feature category is required.";
  }

  return null;
}
