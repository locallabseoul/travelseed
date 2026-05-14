import { NextResponse } from "next/server";
import { sanitizeFeaturePresetPayload, validateFeaturePresetPayload } from "@/lib/server/feature-presets";
import { createServiceRoleClient, verifyAdminRequest } from "@/lib/server/supabase-admin";
import type { FeaturePreset } from "@/types/feature-preset";

function adminError(check: Awaited<ReturnType<typeof verifyAdminRequest>>) {
  return NextResponse.json({ error: check.ok ? "Unexpected admin check state." : check.message }, {
    status: check.ok ? 500 : check.status,
  });
}

export async function GET(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin.ok) {
    return adminError(admin);
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("feature_presets")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ presets: (data ?? []) as FeaturePreset[] });
}

export async function POST(request: Request) {
  const admin = await verifyAdminRequest(request);
  if (!admin.ok) {
    return adminError(admin);
  }

  const body = await request.json().catch(() => null);
  const payload = sanitizeFeaturePresetPayload(body?.preset ?? body ?? {});
  const validationError = validateFeaturePresetPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("feature_presets").insert(payload).select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ preset: data as FeaturePreset }, { status: 201 });
}
