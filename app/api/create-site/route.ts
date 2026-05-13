import { NextResponse } from "next/server";
import {
  createServiceRoleClient,
  sanitizeResortPayload,
  validateResortPayload,
  verifyAuthenticatedRequest,
} from "@/lib/server/supabase-admin";
import type { Resort } from "@/types/resort";

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

    return NextResponse.json({ resort: data as Resort }, { status: 201 });
  } catch (error) {
    console.error("create-site failed", { error, slug: payload.slug });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create the site." },
      { status: 500 },
    );
  }
}
