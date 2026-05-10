import type { Resort } from "@/types/resort";

export const PREVIEW_STORAGE_KEY = "travelseed:create-preview";

export function savePreviewResort(resort: Resort) {
  window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(resort));
}

export function loadPreviewResort() {
  const rawValue = window.localStorage.getItem(PREVIEW_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as Resort;
  } catch {
    return null;
  }
}
