import { getSampleResortBySlug } from "@/lib/sample-resorts";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Resort } from "@/types/resort";

function sortResortServices(resort: Resort): Resort {
  return {
    ...resort,
    services: [...(resort.services ?? [])].sort((first, second) => first.sort_order - second.sort_order),
  };
}

// Fetches an active resort by slug for root-level public site rendering.
export async function getActiveResortBySlug(slug: string): Promise<Resort | null> {
  if (!isSupabaseConfigured) {
    return getSampleResortBySlug(slug);
  }

  const { data, error } = await supabase
    .from("resorts")
    .select("*, services:resort_services(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    return null;
  }

  return sortResortServices(data as Resort);
}

// Normalizes host values so future custom-domain lookups are consistent.
export function normalizeHost(host: string) {
  return host.toLowerCase().replace(/^www\./, "").split(":")[0] ?? host;
}

// Fetches an active resort by custom domain for future host-based tenant routing.
export async function getActiveResortByHost(host: string): Promise<Resort | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const domain = normalizeHost(host);
  const { data, error } = await supabase
    .from("resorts")
    .select("*, services:resort_services(*)")
    .eq("domain", domain)
    .eq("is_active", true)
    .single();

  if (error) {
    return null;
  }

  return sortResortServices(data as Resort);
}
