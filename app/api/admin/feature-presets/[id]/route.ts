import { NextResponse } from "next/server";
import { sanitizeFeaturePresetPayload, validateFeaturePresetPayload } from "@/lib/server/feature-presets";
import { createServiceRoleClient, verifyAdminRequest } from "@/lib/server/supabase-admin";
import type { FeaturePreset } from "@/types/feature-preset";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function adminError(check: Awaited<ReturnType<typeof verifyAdminRequest>>) {
  return NextResponse.json({ error: check.ok ? "Unexpected admin check state." : check.message }, {
    status: check.ok ? 500 : check.status,
  });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const admin = await verifyAdminRequest(request);
  if (!admin.ok) {
    return adminError(admin);
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const payload = sanitizeFeaturePresetPayload(body?.preset ?? body ?? {});
  const validationError = validateFeaturePresetPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("feature_presets")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ preset: data as FeaturePreset });
}
