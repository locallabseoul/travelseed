import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { WebsiteReview } from "@/types/dashboard";
import type { Resort } from "@/types/resort";

type RouteContext = {
  params: Promise<{
    id: string;
    reviewId: string;
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

function updatePayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if ("guestName" in body) {
    payload.guest_name = String(body.guestName ?? "").trim();
  }

  if ("rating" in body) {
    const rating = Number(body.rating);
    payload.rating = Number.isFinite(rating) ? Math.max(1, Math.min(5, Math.round(rating))) : 5;
  }

  if ("reviewText" in body) {
    payload.review_text = String(body.reviewText ?? "").trim();
  }

  if ("sourceLabel" in body) {
    payload.source_label = sourceLabels.includes(body.sourceLabel as ReviewSourceLabel) ? body.sourceLabel : "Manual";
  }

  if ("stayDate" in body) {
    payload.stay_date = String(body.stayDate ?? "").trim() || null;
  }

  if ("status" in body) {
    payload.status = statuses.includes(body.status as ReviewStatus) ? body.status : "draft";
  }

  if ("showOnWebsite" in body) {
    payload.show_on_website = Boolean(body.showOnWebsite);
  }

  if ("featured" in body) {
    payload.featured = Boolean(body.featured);
  }

  if ("sortOrder" in body) {
    const sortOrder = Number(body.sortOrder);
    payload.sort_order = Number.isFinite(sortOrder) ? sortOrder : 0;
  }

  return payload;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id, reviewId } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const body = await request.json().catch(() => null);
  const payload = updatePayload(body ?? {});

  if (payload.guest_name === "") {
    return NextResponse.json({ error: "Guest name is required." }, { status: 400 });
  }

  if (payload.review_text === "") {
    return NextResponse.json({ error: "Review text is required." }, { status: 400 });
  }

  const { data, error } = await check.supabase
    .from("website_reviews")
    .update(payload)
    .eq("id", reviewId)
    .eq("resort_id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id, reviewId } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const { error } = await check.supabase
    .from("website_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("resort_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
