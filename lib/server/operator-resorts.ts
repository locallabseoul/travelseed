import { NextResponse } from "next/server";
import { createServiceRoleClient, verifyAuthenticatedRequest } from "@/lib/server/supabase-admin";
import type { Resort } from "@/types/resort";

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

export async function requireManagedResort(request: Request, id: string) {
  const user = await verifyAuthenticatedRequest(request);
  if (!user.ok) {
    return { ok: false as const, response: userError(user) };
  }

  const supabase = createServiceRoleClient();
  const { data: resort, error } = await supabase.from("resorts").select("*").eq("id", id).single();

  if (error || !resort) {
    return { ok: false as const, response: NextResponse.json({ error: error?.message ?? "Site not found." }, { status: 404 }) };
  }

  if (!canManageResort(resort as Resort, user)) {
    return { ok: false as const, response: NextResponse.json({ error: "You can only manage sites connected to your account." }, { status: 403 }) };
  }

  return { ok: true as const, supabase, resort: resort as Resort };
}
