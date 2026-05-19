import { NextResponse } from "next/server";
import {
  createServiceRoleClient,
  sanitizeResortPayload,
  validateResortPayload,
  verifyAuthenticatedRequest,
} from "@/lib/server/supabase-admin";
import type { Resort, ResortOfferInput } from "@/types/resort";

export const runtime = "nodejs";

function isDataUrl(value: string | null) {
  return Boolean(value?.startsWith("data:"));
}

function dataUrlParts(dataUrl: string) {
  const [header, base64Data] = dataUrl.split(",");
  const mimeType = header.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";

  return {
    buffer: Buffer.from(base64Data ?? "", "base64"),
    mimeType,
  };
}

async function uploadDataUrlIfNeeded(imageUrl: string | null, slug: string, folder: "hero" | "gallery", index = 0) {
  if (!imageUrl || !isDataUrl(imageUrl)) {
    return imageUrl;
  }

  const supabase = createServiceRoleClient();
  const { buffer, mimeType } = dataUrlParts(imageUrl);
  const extension = mimeType.split("/")[1] || "jpg";
  const filePath = `${slug}/${folder}/${folder}-${index}.${extension}`;
  const { error } = await supabase.storage.from("resort-images").upload(filePath, buffer, {
    cacheControl: "3600",
    contentType: mimeType,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("resort-images").getPublicUrl(filePath);
  return data.publicUrl;
}

function sanitizeServices(services: ResortOfferInput[], resortId: string) {
  return services
    .slice(0, 8)
    .map((service, index) => {
      const kind = ["room", "service", "package"].includes(service.kind) ? service.kind : "service";
      const isRoom = kind === "room";

      return {
        resort_id: resortId,
        kind,
        title: service.title?.trim() ?? "",
        description: service.description?.trim() || null,
        price_label: service.price_label?.trim() || null,
        capacity: typeof service.capacity === "number" && Number.isFinite(service.capacity) ? service.capacity : null,
        image_url: service.image_url?.trim() || null,
        highlight: service.highlight?.trim() || null,
        duration: service.duration?.trim() || null,
        included: Array.isArray(service.included) ? service.included.map((item) => String(item).trim()).filter(Boolean).slice(0, 6) : [],
        cta_label: service.cta_label?.trim() || null,
        bed_type: isRoom ? service.bed_type?.trim() || null : null,
        room_size: isRoom ? service.room_size?.trim() || null : null,
        view_type: isRoom ? service.view_type?.trim() || null : null,
        bathroom_info: isRoom ? service.bathroom_info?.trim() || null : null,
        max_guests: isRoom && typeof service.max_guests === "number" && Number.isFinite(service.max_guests) ? service.max_guests : null,
        room_amenities: isRoom && Array.isArray(service.room_amenities) ? service.room_amenities.map((item) => String(item).trim()).filter(Boolean).slice(0, 8) : [],
        sort_order: service.sort_order ?? index,
        is_active: service.is_active ?? true,
        updated_at: new Date().toISOString(),
      };
    })
    .filter((service) => service.title);
}

// Public site creation endpoint. Supabase writes happen server-side so anon RLS can stay locked down.
export async function POST(request: Request) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return NextResponse.json({ error: user.message }, { status: user.status });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Could not read the site data. Remove large photos or upload smaller images, then try again." },
      { status: 400 },
    );
  }

  const payload = sanitizeResortPayload(body?.resort ?? {});
  const validationError = validateResortPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const heroImageUrl = await uploadDataUrlIfNeeded(payload.hero_image_url, payload.slug, "hero");
    const gallery = await Promise.all(
      payload.gallery.map((imageUrl, index) => uploadDataUrlIfNeeded(imageUrl, payload.slug, "gallery", index)),
    );
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("resorts")
      .insert({
        ...payload,
        owner_user_id: user.userId,
        owner_email: user.email,
        hero_image_url: heroImageUrl,
        gallery: gallery.filter(Boolean),
      })
      .select("*")
      .single();

    if (error) {
      console.error("create-site insert failed", { code: error.code, message: error.message, slug: payload.slug });
      return NextResponse.json({ error: error.message }, { status: error.code === "23505" ? 409 : 500 });
    }

    const services = sanitizeServices(Array.isArray(body?.services) ? body.services : [], data.id);

    if (services.length > 0) {
      const { error: servicesError } = await supabase.from("resort_services").insert(services);

      if (servicesError) {
        console.error("create-site services insert failed", { message: servicesError.message, resortId: data.id });
      }
    }

    return NextResponse.json({ resort: data as Resort }, { status: 201 });
  } catch (error) {
    console.error("create-site failed", { error, slug: payload.slug });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create the site." },
      { status: 500 },
    );
  }
}
