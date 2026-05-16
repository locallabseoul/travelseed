import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { Resort, ResortOfferInput } from "@/types/resort";

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

function sanitizeServices(services: ResortOfferInput[], resortId: string) {
  return services
    .map((service, index) => {
      const kind = ["room", "service", "package"].includes(service.kind) ? service.kind : "service";
      const isRoom = kind === "room";

      return {
        resort_id: resortId,
        kind,
        title: service.title.trim(),
        description: service.description?.trim() || null,
        price_label: service.price_label?.trim() || null,
        capacity: typeof service.capacity === "number" && Number.isFinite(service.capacity) ? service.capacity : null,
        image_url: service.image_url?.trim() || null,
        highlight: service.highlight?.trim() || null,
        duration: service.duration?.trim() || null,
        included: Array.isArray(service.included) ? service.included.map((item) => String(item).trim()).filter(Boolean) : [],
        cta_label: service.cta_label?.trim() || null,
        bed_type: isRoom ? service.bed_type?.trim() || null : null,
        room_size: isRoom ? service.room_size?.trim() || null : null,
        view_type: isRoom ? service.view_type?.trim() || null : null,
        bathroom_info: isRoom ? service.bathroom_info?.trim() || null : null,
        max_guests: isRoom && typeof service.max_guests === "number" && Number.isFinite(service.max_guests) ? service.max_guests : null,
        room_amenities: isRoom && Array.isArray(service.room_amenities) ? service.room_amenities.map((item) => String(item).trim()).filter(Boolean) : [],
        sort_order: service.sort_order ?? index,
        is_active: service.is_active ?? true,
        updated_at: new Date().toISOString(),
      };
    })
    .filter((service) => service.title);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data: resort, error: loadError } = await supabase.from("resorts").select("*").eq("id", id).single();

  if (loadError || !resort) {
    return NextResponse.json({ error: loadError?.message ?? "Site not found." }, { status: 404 });
  }

  if (!canManageResort(resort as Resort, user)) {
    return NextResponse.json({ error: "You can only manage sites connected to your account." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const services = sanitizeServices(Array.isArray(body?.services) ? body.services : [], id);

  if (services.length === 0) {
    const { error: deleteError } = await supabase.from("resort_services").delete().eq("resort_id", id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ services: [] });
  }

  const { data, error } = await supabase
    .from("resort_services")
    .insert(services)
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const insertedIds = (data ?? []).map((service) => service.id).filter(Boolean);
  const deleteQuery = supabase.from("resort_services").delete().eq("resort_id", id);
  const { error: deleteError } = insertedIds.length > 0
    ? await deleteQuery.not("id", "in", `(${insertedIds.join(",")})`)
    : await deleteQuery;

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ services: data ?? [] });
}
