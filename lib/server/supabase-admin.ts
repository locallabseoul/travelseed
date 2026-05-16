import { createClient } from "@supabase/supabase-js";
import { validatePublicSlug } from "@/lib/slugs";
import { siteTypeForPlanType } from "@/lib/template-catalog";
import type { Resort, ResortUpsert } from "@/types/resort";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type AdminCheck =
  | { ok: true; email: string }
  | { ok: false; status: number; message: string };

export type UserCheck =
  | { ok: true; userId: string; email: string }
  | { ok: false; status: number; message: string };

export function createServiceRoleClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase service role environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function adminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export async function verifyAdminRequest(request: Request): Promise<AdminCheck> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { ok: false, status: 500, message: "Supabase server environment variables are not configured." };
  }

  const allowedEmails = adminEmailSet();
  if (allowedEmails.size === 0) {
    return { ok: false, status: 500, message: "ADMIN_EMAILS is not configured." };
  }

  const token = bearerToken(request);
  if (!token) {
    return { ok: false, status: 401, message: "Missing admin session." };
  }

  const authClient = createServiceRoleClient();
  const { data, error } = await authClient.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();

  if (error || !email) {
    console.error("Admin session validation failed", { message: error?.message });
    return { ok: false, status: 401, message: "Invalid admin session." };
  }

  if (!allowedEmails.has(email)) {
    return { ok: false, status: 403, message: "This account is not allowed to manage Travelseed." };
  }

  return { ok: true, email };
}

export async function verifyAuthenticatedRequest(request: Request): Promise<UserCheck> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { ok: false, status: 500, message: "Supabase server environment variables are not configured." };
  }

  const token = bearerToken(request);
  if (!token) {
    return { ok: false, status: 401, message: "Sign in before creating a site." };
  }

  const authClient = createServiceRoleClient();
  const { data, error } = await authClient.auth.getUser(token);
  const userId = data.user?.id;
  const email = data.user?.email?.toLowerCase();

  if (error || !userId || !email) {
    console.error("Customer session validation failed", { message: error?.message });
    return { ok: false, status: 401, message: "Invalid session. Sign in again before creating a site." };
  }

  return { ok: true, userId, email };
}

export function sanitizeResortPayload(payload: Partial<ResortUpsert>): ResortUpsert {
  const plan = payload.plan ?? "Tree";
  const planType = payload.plan_type ?? planTypeFor(plan);

  return {
    name: String(payload.name ?? "").trim(),
    slug: String(payload.slug ?? "").trim(),
    domain: payload.domain ? String(payload.domain).trim() : null,
    template_id: String(payload.template_id ?? "boutique-villa"),
    location: String(payload.location ?? "").trim(),
    type: payload.type ? String(payload.type).trim() : null,
    description: payload.description ? String(payload.description).trim() : null,
    hero_title: String(payload.hero_title ?? "").trim(),
    hero_subtitle: payload.hero_subtitle ? String(payload.hero_subtitle).trim() : null,
    hero_image_url: payload.hero_image_url ? String(payload.hero_image_url).trim() : null,
    whatsapp_number: String(payload.whatsapp_number ?? "").trim(),
    capacity: typeof payload.capacity === "number" && Number.isFinite(payload.capacity) ? payload.capacity : null,
    bedrooms: typeof payload.bedrooms === "number" && Number.isFinite(payload.bedrooms) ? payload.bedrooms : null,
    bathrooms: typeof payload.bathrooms === "number" && Number.isFinite(payload.bathrooms) ? payload.bathrooms : null,
    features: Array.isArray(payload.features) ? payload.features.map(String).filter(Boolean) : [],
    gallery: Array.isArray(payload.gallery) ? payload.gallery.map(String).filter(Boolean) : [],
    experiences: Array.isArray(payload.experiences) ? payload.experiences.map(String).filter(Boolean) : [],
    booking_message_template: payload.booking_message_template
      ? String(payload.booking_message_template)
      : null,
    design_settings: typeof payload.design_settings === "object" && payload.design_settings ? payload.design_settings : {},
    is_active: Boolean(payload.is_active),
    domain_status: payload.domain_status ?? (payload.domain ? "pending" : "not_connected"),
    ssl_status: payload.ssl_status ?? "pending",
    domain_verified_at: payload.domain_verified_at ?? null,
    plan,
    plan_type: planType,
    site_type: payload.site_type ?? siteTypeForPlanType(planType),
    updated_at: payload.updated_at ?? new Date().toISOString(),
  };
}

function planTypeFor(plan: ResortUpsert["plan"]) {
  if (plan === "Seed Trial") {
    return "freeTrial";
  }

  if (plan === "Seed") {
    return "seed";
  }

  if (plan === "Forest") {
    return "forest";
  }

  return "tree";
}

export function validateResortPayload(payload: ResortUpsert) {
  const missingFields = [
    ["name", payload.name],
    ["slug", payload.slug],
    ["location", payload.location],
    ["hero_title", payload.hero_title],
    ["whatsapp_number", payload.whatsapp_number],
  ].filter(([, value]) => !value);

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.map(([field]) => field).join(", ")}.`;
  }

  const slugError = validatePublicSlug(payload.slug);
  if (slugError) {
    return slugError;
  }

  return null;
}

export function storagePathFromPublicUrl(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    const marker = "/storage/v1/object/public/resort-images/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

export type StorageListItem = {
  name: string;
  id?: string | null;
  metadata?: unknown;
};

export async function listStoragePaths(prefix: string): Promise<string[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from("resort-images").list(prefix);

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []) as StorageListItem[];
  const paths = await Promise.all(
    items.map(async (item) => {
      const path = `${prefix}/${item.name}`;
      const isFile = Boolean(item.id || item.metadata);

      return isFile ? [path] : listStoragePaths(path);
    }),
  );

  return paths.flat();
}

export async function deleteResortStorageAssets(resort: Resort) {
  const supabase = createServiceRoleClient();
  const listedPaths = await Promise.all([
    listStoragePaths(`${resort.slug}/hero`).catch(() => []),
    listStoragePaths(`${resort.slug}/gallery`).catch(() => []),
  ]);
  const urlPaths = [resort.hero_image_url, ...resort.gallery]
    .map((imageUrl) => (imageUrl ? storagePathFromPublicUrl(imageUrl) : null))
    .filter(Boolean) as string[];
  const paths = [...new Set([...listedPaths.flat(), ...urlPaths])];

  if (paths.length === 0) {
    return;
  }

  const { error } = await supabase.storage.from("resort-images").remove(paths);
  if (error) {
    throw new Error(error.message);
  }
}
