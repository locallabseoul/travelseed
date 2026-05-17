import { NextResponse } from "next/server";
import { requireManagedResort } from "@/lib/server/operator-resorts";

type RouteContext = {
  params: Promise<{
    id: string;
    voucherId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { id, voucherId } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const now = new Date().toISOString();
  const { data, error } = await check.supabase
    .from("booking_vouchers")
    .update({
      status: "issued",
      issued_at: now,
      voided_at: null,
      updated_at: now,
    })
    .eq("id", voucherId)
    .eq("resort_id", id)
    .neq("status", "void")
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ voucher: data });
}
