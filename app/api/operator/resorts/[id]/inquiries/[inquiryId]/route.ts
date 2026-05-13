import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { InquiryStatus } from "@/types/dashboard";
import type { Resort } from "@/types/resort";

type RouteContext = {
  params: Promise<{
    id: string;
    inquiryId: string;
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

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const { id, inquiryId } = await params;
  const supabase = createServiceRoleClient();
  const { data: resort, error: resortError } = await supabase.from("resorts").select("*").eq("id", id).single();

  if (resortError || !resort) {
    return NextResponse.json({ error: resortError?.message ?? "Site not found." }, { status: 404 });
  }

  if (!canManageResort(resort as Resort, user)) {
    return NextResponse.json({ error: "You can only manage sites connected to your account." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const status = statuses.includes(body?.status as InquiryStatus) ? (body.status as InquiryStatus) : null;

  if (!status) {
    return NextResponse.json({ error: "Valid status is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("booking_inquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", inquiryId)
    .eq("resort_id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inquiry: data });
}
