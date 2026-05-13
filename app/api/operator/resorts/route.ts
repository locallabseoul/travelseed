import { NextResponse } from "next/server";
import {
  createServiceRoleClient,
  sanitizeResortPayload,
  validateResortPayload,
  verifyAuthenticatedRequest,
} from "@/lib/server/supabase-admin";
import type { Resort } from "@/types/resort";

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
  const [ownedResult, legacyResult] = await Promise.all([
    supabase
      .from("resorts")
      .select("*")
      .or(`owner_user_id.eq.${user.userId},owner_email.eq.${user.email}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("resorts")
      .select("*")
      .is("owner_user_id", null)
      .is("owner_email", null)
      .order("created_at", { ascending: false }),
  ]);

  if (ownedResult.error || legacyResult.error) {
    return NextResponse.json({ error: ownedResult.error?.message ?? legacyResult.error?.message }, { status: 500 });
  }

  const resortsById = new Map<string, Resort>();
  for (const resort of [...(ownedResult.data ?? []), ...(legacyResult.data ?? [])] as Resort[]) {
    resortsById.set(resort.id, resort);
  }

  return NextResponse.json({ resorts: Array.from(resortsById.values()) });
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
