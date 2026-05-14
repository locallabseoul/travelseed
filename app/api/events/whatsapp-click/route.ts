import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json().catch(async () => {
    const text = await request.text().catch(() => "");
    return text ? JSON.parse(text) : null;
  }).catch(() => null);
  const resortId = typeof body?.resortId === "string" ? body.resortId : "";
  const source = typeof body?.source === "string" ? body.source : "booking_cta";
  const inquiry = typeof body?.inquiry === "object" && body.inquiry ? body.inquiry as Record<string, unknown> : null;

  if (!resortId) {
    return NextResponse.json({ error: "Missing resort id." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: resort, error: resortError } = await supabase
    .from("resorts")
    .select("id,is_active")
    .eq("id", resortId)
    .single();

  if (resortError || !resort?.is_active) {
    return NextResponse.json({ error: resortError?.message ?? "Site not found." }, { status: 404 });
  }

  const { error } = await supabase.from("site_events").insert({
    resort_id: resortId,
    event_type: "whatsapp_click",
    source,
    metadata: {
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (inquiry) {
    const guests = Number(inquiry.guests);
    const { error: inquiryError } = await supabase.from("booking_inquiries").insert({
      resort_id: resortId,
      guest_name: String(inquiry.guestName ?? "").trim() || "Website WhatsApp guest",
      guest_contact: String(inquiry.guestContact ?? "").trim() || null,
      check_in: String(inquiry.checkIn ?? "").trim() || null,
      check_out: String(inquiry.checkOut ?? "").trim() || null,
      guests: Number.isFinite(guests) && guests > 0 ? guests : null,
      status: "new",
      source,
      notes: String(inquiry.notes ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    });

    if (inquiryError) {
      return NextResponse.json({ error: inquiryError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
