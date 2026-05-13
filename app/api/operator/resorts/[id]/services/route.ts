import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { Resort, ResortServiceInput } from "@/types/resort";

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

function sanitizeServices(services: ResortServiceInput[], resortId: string) {
  return services
    .map((service, index) => ({
      resort_id: resortId,
      kind: ["room", "service", "package"].includes(service.kind) ? service.kind : "service",
      title: service.title.trim(),
      description: service.description?.trim() || null,
      price_label: service.price_label?.trim() || null,
      capacity: typeof service.capacity === "number" && Number.isFinite(service.capacity) ? service.capacity : null,
      image_url: service.image_url?.trim() || null,
      sort_order: service.sort_order ?? index,
      is_active: service.is_active ?? true,
      updated_at: new Date().toISOString(),
    }))
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

  const { error: deleteError } = await supabase.from("resort_services").delete().eq("resort_id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (services.length === 0) {
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

  return NextResponse.json({ services: data ?? [] });
}
