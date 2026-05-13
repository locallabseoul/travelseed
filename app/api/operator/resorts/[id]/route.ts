import { NextResponse } from "next/server";
import {
  createServiceRoleClient,
  deleteResortStorageAssets,
  sanitizeResortPayload,
  validateResortPayload,
  verifyAuthenticatedRequest,
} from "@/lib/server/supabase-admin";
import type { Resort } from "@/types/resort";

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

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const payload = sanitizeResortPayload(body?.resort ?? body ?? {});
  const validationError = validateResortPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("resorts")
    .update({
      ...payload,
      owner_user_id: user.userId,
      owner_email: user.email,
    })
    .eq("id", id)
    .eq("owner_user_id", user.userId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ resort: data as Resort });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return userError(user);
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data: resort, error: loadError } = await supabase
    .from("resorts")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", user.userId)
    .single();

  if (loadError || !resort) {
    return NextResponse.json({ error: loadError?.message ?? "Site not found." }, { status: 404 });
  }

  await deleteResortStorageAssets(resort as Resort);

  const { error } = await supabase.from("resorts").delete().eq("id", id).eq("owner_user_id", user.userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
