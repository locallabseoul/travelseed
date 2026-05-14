import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { WebsiteReview } from "@/types/dashboard";
import type { Resort } from "@/types/resort";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ReviewStatus = WebsiteReview["status"];
type ReviewSourceLabel = WebsiteReview["sourceLabel"];

const statuses: ReviewStatus[] = ["published", "draft"];
const sourceLabels: ReviewSourceLabel[] = ["Manual", "Google", "Guest Message"];

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

function sanitizeReview(body: Record<string, unknown>, resortId: string, fallbackSortOrder = 0) {
  const rating = Number(body.rating);
  const sourceLabel = sourceLabels.includes(body.sourceLabel as ReviewSourceLabel) ? (body.sourceLabel as ReviewSourceLabel) : "Manual";
  const status = statuses.includes(body.status as ReviewStatus) ? (body.status as ReviewStatus) : "draft";
  const sortOrder = Number(body.sortOrder);

  return {
    resort_id: resortId,
    guest_name: String(body.guestName ?? "").trim(),
    rating: Number.isFinite(rating) ? Math.max(1, Math.min(5, Math.round(rating))) : 5,
    review_text: String(body.reviewText ?? "").trim(),
    source_label: sourceLabel,
    stay_date: String(body.stayDate ?? "").trim() || null,
    status,
    show_on_website: Boolean(body.showOnWebsite),
    featured: Boolean(body.featured),
    sort_order: Number.isFinite(sortOrder) ? sortOrder : fallbackSortOrder,
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const { data, error } = await check.supabase
    .from("website_reviews")
    .select("*")
    .eq("resort_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const body = await request.json().catch(() => null);

  const { count, error: countError } = await check.supabase
    .from("website_reviews")
    .select("id", { count: "exact", head: true })
    .eq("resort_id", id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const payload = sanitizeReview(body ?? {}, id, count ?? 0);

  if (!payload.guest_name) {
    return NextResponse.json({ error: "Guest name is required." }, { status: 400 });
  }

  if (!payload.review_text) {
    return NextResponse.json({ error: "Review text is required." }, { status: 400 });
  }

  const { data, error } = await check.supabase.from("website_reviews").insert(payload).select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data }, { status: 201 });
}
