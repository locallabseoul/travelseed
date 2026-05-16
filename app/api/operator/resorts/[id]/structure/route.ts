import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { Resort, ResortNavigationItemInput, ResortSitePageInput, ResortSiteSectionInput } from "@/types/resort";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const pageTypes = ["Standard", "Landing", "Event", "Wedding", "Tour", "Membership"];

function userError(check: Awaited<ReturnType<typeof verifyAuthenticatedRequest>>) {
  return NextResponse.json({ error: check.ok ? "Unexpected session check state." : check.message }, {
    status: check.ok ? 500 : check.status,
  });
}

function canManageResort(resort: Resort, user: Extract<Awaited<ReturnType<typeof verifyAuthenticatedRequest>>, { ok: true }>) {
  if (resort.owner_user_id) {
    return resort.owner_user_id === user.userId;
  }

  if (resort.owner_email) {
    return resort.owner_email === user.email;
  }

  return false;
}

async function requireManagedResort(request: Request, id: string) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return { ok: false as const, response: userError(user) };
  }

  const supabase = createServiceRoleClient();
  const { data: resort, error } = await supabase.from("resorts").select("*").eq("id", id).single();

  if (error || !resort) {
    return { ok: false as const, response: NextResponse.json({ error: error?.message ?? "Site not found." }, { status: 404 }) };
  }

  if (!canManageResort(resort as Resort, user)) {
    return { ok: false as const, response: NextResponse.json({ error: "You can only manage sites connected to your account." }, { status: 403 }) };
  }

  return { ok: true as const, supabase };
}

function sanitizeSections(sections: ResortSiteSectionInput[], resortId: string) {
  return sections
    .map((section, index) => ({
      resort_id: resortId,
      section_key: String(section.section_key ?? "").trim(),
      label: String(section.label ?? "").trim(),
      is_enabled: section.is_enabled ?? true,
      is_locked: section.is_locked ?? false,
      sort_order: section.sort_order ?? index,
      settings: section.settings ?? {},
      updated_at: new Date().toISOString(),
    }))
    .filter((section) => section.section_key && section.label);
}

function sanitizePages(pages: ResortSitePageInput[], resortId: string) {
  return pages
    .map((page, index) => ({
      resort_id: resortId,
      title: String(page.title ?? "").trim(),
      slug: normalizePageSlug(page.slug),
      page_type: pageTypes.includes(String(page.page_type)) ? page.page_type : "Standard",
      is_published: page.is_published ?? true,
      hero_image_url: page.hero_image_url ? String(page.hero_image_url).trim() : null,
      seo_title: page.seo_title ? String(page.seo_title).trim() : null,
      seo_description: page.seo_description ? String(page.seo_description).trim() : null,
      sort_order: page.sort_order ?? index,
      settings: page.settings && typeof page.settings === "object" ? page.settings : {},
      updated_at: new Date().toISOString(),
    }))
    .filter((page) => page.title && page.slug);
}

function sanitizeNavigationItems(items: ResortNavigationItemInput[], resortId: string) {
  return items
    .map((item, index) => ({
      resort_id: resortId,
      label: String(item.label ?? "").trim(),
      href: String(item.href ?? "").trim(),
      page_id: item.page_id ?? null,
      is_enabled: item.is_enabled ?? true,
      sort_order: item.sort_order ?? index,
      updated_at: new Date().toISOString(),
    }))
    .filter((item) => item.label && item.href);
}

function normalizePageSlug(value: string) {
  const slug = String(value ?? "").trim();
  if (!slug || slug === "/") {
    return "/";
  }
  return `/${slug.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const [sectionsResult, pagesResult, navigationResult] = await Promise.all([
    check.supabase.from("site_sections").select("*").eq("resort_id", id).order("sort_order", { ascending: true }),
    check.supabase.from("site_pages").select("*").eq("resort_id", id).order("sort_order", { ascending: true }),
    check.supabase.from("site_navigation_items").select("*").eq("resort_id", id).order("sort_order", { ascending: true }),
  ]);

  const error = sectionsResult.error ?? pagesResult.error ?? navigationResult.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    sections: sectionsResult.data ?? [],
    pages: pagesResult.data ?? [],
    navigationItems: navigationResult.data ?? [],
  });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const body = await request.json().catch(() => null);
  const sections = sanitizeSections(Array.isArray(body?.sections) ? body.sections : [], id);
  const pages = sanitizePages(Array.isArray(body?.pages) ? body.pages : [], id);
  const navigationItems = sanitizeNavigationItems(Array.isArray(body?.navigationItems) ? body.navigationItems : [], id);

  const [sectionDelete, pageDelete, navigationDelete] = await Promise.all([
    check.supabase.from("site_sections").delete().eq("resort_id", id),
    check.supabase.from("site_pages").delete().eq("resort_id", id),
    check.supabase.from("site_navigation_items").delete().eq("resort_id", id),
  ]);

  const deleteError = sectionDelete.error ?? pageDelete.error ?? navigationDelete.error;
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const [sectionInsert, pageInsert, navigationInsert] = await Promise.all([
    sections.length > 0 ? check.supabase.from("site_sections").insert(sections).select("*").order("sort_order", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    pages.length > 0 ? check.supabase.from("site_pages").insert(pages).select("*").order("sort_order", { ascending: true }) : Promise.resolve({ data: [], error: null }),
    navigationItems.length > 0 ? check.supabase.from("site_navigation_items").insert(navigationItems).select("*").order("sort_order", { ascending: true }) : Promise.resolve({ data: [], error: null }),
  ]);

  const insertError = sectionInsert.error ?? pageInsert.error ?? navigationInsert.error;
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    sections: sectionInsert.data ?? [],
    pages: pageInsert.data ?? [],
    navigationItems: navigationInsert.data ?? [],
  });
}
