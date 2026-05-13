import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json().catch(async () => {
    const text = await request.text().catch(() => "");
    return text ? JSON.parse(text) : null;
  }).catch(() => null);
  const resortId = typeof body?.resortId === "string" ? body.resortId : "";
  const source = typeof body?.source === "string" ? body.source : "booking_cta";

  if (!resortId) {
    return NextResponse.json({ error: "Missing resort id." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
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

  return NextResponse.json({ ok: true });
}
