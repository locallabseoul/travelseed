import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { DashboardNotificationSummary } from "@/types/dashboard";
import type { Resort } from "@/types/resort";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(request: Request, { params }: RouteContext) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data: resort, error: resortError } = await supabase.from("resorts").select("*").eq("id", id).single();

  if (resortError || !resort) {
    return NextResponse.json({ error: resortError?.message ?? "Site not found." }, { status: 404 });
  }

  if (!canManageResort(resort as Resort, user)) {
    return NextResponse.json({ error: "You can only manage sites connected to your account." }, { status: 403 });
  }

  const { count, error } = await supabase
    .from("booking_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("resort_id", id)
    .eq("status", "new");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const newInquiriesCount = count ?? 0;
  const notifications: DashboardNotificationSummary = {
    total: newInquiriesCount,
    items: newInquiriesCount > 0 ? [{ id: "inquiries:new", tab: "inquiries", label: "New inquiries", count: newInquiriesCount }] : [],
    byTab: newInquiriesCount > 0 ? { inquiries: newInquiriesCount } : {},
  };

  return NextResponse.json({ notifications });
}
