import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/server/supabase-admin";
import type { FeaturePreset } from "@/types/feature-preset";

export async function GET() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("feature_presets")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ presets: (data ?? []) as FeaturePreset[] });
}
