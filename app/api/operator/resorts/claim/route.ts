import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { Resort } from "@/types/resort";

function userError(check: Awaited<ReturnType<typeof verifyAuthenticatedRequest>>) {
  return NextResponse.json({ error: check.ok ? "Unexpected session check state." : check.message }, {
    status: check.ok ? 500 : check.status,
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const body = await request.json().catch(() => null);
  const slug = slugify(String(body?.slug ?? ""));

  if (!slug) {
    return NextResponse.json({ error: "Enter the site slug to connect." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: existingResort, error: loadError } = await supabase
    .from("resorts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (loadError || !existingResort) {
    return NextResponse.json({ error: "Site not found." }, { status: 404 });
  }

  const resort = existingResort as Resort;

  if (resort.owner_user_id && resort.owner_user_id !== user.userId) {
    return NextResponse.json({ error: "This site is already connected to another account." }, { status: 403 });
  }

  if (resort.owner_email && resort.owner_email !== user.email) {
    return NextResponse.json({ error: "This site is already connected to another email." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("resorts")
    .update({
      owner_user_id: user.userId,
      owner_email: user.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resort.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resort: data as Resort });
}
