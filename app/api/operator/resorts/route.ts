import { NextResponse } from "next/server";
import {
  createServiceRoleClient,
  sanitizeResortPayload,
  validateResortPayload,
  verifyAuthenticatedRequest,
} from "@/lib/server/supabase-admin";
import type { Resort, ResortWithMetrics } from "@/types/resort";

type SiteEventRow = {
  resort_id: string;
  event_type: string;
  source: string | null;
  created_at: string;
};

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
  const eventsByResortId = new Map<string, SiteEventRow[]>();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgoIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  if (resortIds.length > 0) {
    const { data: events, error: eventsError } = await supabase
      .from("site_events")
      .select("resort_id,event_type,source,created_at")
      .eq("event_type", "whatsapp_click")
      .in("resort_id", resortIds)
      .gte("created_at", thirtyDaysAgoIso)
      .order("created_at", { ascending: false });

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    for (const event of (events ?? []) as SiteEventRow[]) {
      eventCounts.set(event.resort_id, (eventCounts.get(event.resort_id) ?? 0) + 1);
      eventsByResortId.set(event.resort_id, [...(eventsByResortId.get(event.resort_id) ?? []), event]);
    }

    const { data: services, error: servicesError } = await supabase
      .from("resort_services")
      .select("*")
      .in("resort_id", resortIds)
      .order("sort_order", { ascending: true });

    if (servicesError) {
      return NextResponse.json({ error: servicesError.message }, { status: 500 });
    }

    const servicesByResortId = new Map<string, Resort["services"]>();
    for (const service of (services ?? []) as NonNullable<Resort["services"]>) {
      servicesByResortId.set(service.resort_id, [...(servicesByResortId.get(service.resort_id) ?? []), service]);
    }

    const resortsWithMetrics: ResortWithMetrics[] = resorts.map((resort) => ({
      ...resort,
      services: servicesByResortId.get(resort.id) ?? [],
      whatsapp_clicks_count: eventCounts.get(resort.id) ?? 0,
      analytics: analyticsForEvents(eventsByResortId.get(resort.id) ?? [], sevenDaysAgo),
    }));

    return NextResponse.json({ resorts: resortsWithMetrics });
  }

  const resortsWithMetrics: ResortWithMetrics[] = resorts.map((resort) => ({
    ...resort,
    services: [],
    whatsapp_clicks_count: eventCounts.get(resort.id) ?? 0,
    analytics: analyticsForEvents(eventsByResortId.get(resort.id) ?? [], sevenDaysAgo),
  }));

  return NextResponse.json({ resorts: resortsWithMetrics });
}

function analyticsForEvents(events: SiteEventRow[], sevenDaysAgo: number) {
  const dailyCounts = new Map<string, number>();
  let whatsappClicks7d = 0;

  for (const event of events) {
    const timestamp = new Date(event.created_at).getTime();
    const dateKey = event.created_at.slice(0, 10);
    dailyCounts.set(dateKey, (dailyCounts.get(dateKey) ?? 0) + 1);

    if (timestamp >= sevenDaysAgo) {
      whatsappClicks7d += 1;
    }
  }

  return {
    whatsappClicks7d,
    whatsappClicks30d: events.length,
    recentEvents: events.slice(0, 6).map((event) => ({
      eventType: event.event_type,
      source: event.source ?? "booking_cta",
      createdAt: event.created_at,
    })),
    dailyClicks: Array.from(dailyCounts.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, whatsappClicks]) => ({ date, whatsappClicks })),
  };
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
