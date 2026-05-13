import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { InquiryStatus } from "@/types/dashboard";
import type { Resort } from "@/types/resort";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const statuses: InquiryStatus[] = ["new", "contacted", "confirmed", "cancelled"];

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

function sanitizeInquiry(body: Record<string, unknown>, resortId: string) {
  const status = statuses.includes(body.status as InquiryStatus) ? (body.status as InquiryStatus) : "new";
  const guests = Number(body.guests);

  return {
    resort_id: resortId,
    guest_name: String(body.guestName ?? "").trim(),
    guest_contact: String(body.guestContact ?? "").trim() || null,
    check_in: String(body.checkIn ?? "").trim() || null,
    check_out: String(body.checkOut ?? "").trim() || null,
    guests: Number.isFinite(guests) && guests > 0 ? guests : null,
    status,
    source: String(body.source ?? "manual").trim() || "manual",
    notes: String(body.notes ?? "").trim() || null,
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
    .from("booking_inquiries")
    .select("*")
    .eq("resort_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inquiries: data ?? [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const body = await request.json().catch(() => null);
  const payload = sanitizeInquiry(body ?? {}, id);

  if (!payload.guest_name) {
    return NextResponse.json({ error: "Guest name is required." }, { status: 400 });
  }

  const { data, error } = await check.supabase.from("booking_inquiries").insert(payload).select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inquiry: data });
}
