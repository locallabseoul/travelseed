import { NextResponse } from "next/server";
import {
  createServiceRoleClient,
  sanitizeResortPayload,
  validateResortPayload,
  verifyAuthenticatedRequest,
} from "@/lib/server/supabase-admin";
import type { Resort, ResortWithMetrics } from "@/types/resort";

function userError(check: Awaited<ReturnType<typeof verifyAuthenticatedRequest>>) {
  return NextResponse.json({ error: check.ok ? "Unexpected session check state." : check.message }, {
    status: check.ok ? 500 : check.status,
  });
}

export async function GET(request: Request) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("resorts")
    .select("*")
    .or(`owner_user_id.eq.${user.userId},owner_email.eq.${user.email}`)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resorts = (data ?? []) as Resort[];
  const resortIds = resorts.map((resort) => resort.id);
  const eventCounts = new Map<string, number>();

  if (resortIds.length > 0) {
    const { data: events, error: eventsError } = await supabase
      .from("site_events")
      .select("resort_id")
      .eq("event_type", "whatsapp_click")
      .in("resort_id", resortIds);

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    for (const event of (events ?? []) as Array<{ resort_id: string }>) {
      eventCounts.set(event.resort_id, (eventCounts.get(event.resort_id) ?? 0) + 1);
    }
  }

  const resortsWithMetrics: ResortWithMetrics[] = resorts.map((resort) => ({
    ...resort,
    whatsapp_clicks_count: eventCounts.get(resort.id) ?? 0,
  }));

  return NextResponse.json({ resorts: resortsWithMetrics });
}

export async function POST(request: Request) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const body = await request.json().catch(() => null);
  const payload = sanitizeResortPayload(body?.resort ?? body ?? {});
  const validationError = validateResortPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("resorts")
    .insert({
      ...payload,
      owner_user_id: user.userId,
      owner_email: user.email,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ resort: data as Resort }, { status: 201 });
}
