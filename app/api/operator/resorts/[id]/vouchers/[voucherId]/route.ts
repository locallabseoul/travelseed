import { NextResponse } from "next/server";
import { requireManagedResort } from "@/lib/server/operator-resorts";

type RouteContext = {
  params: Promise<{
    id: string;
    voucherId: string;
  }>;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

async function roomOfferIdFor(check: Awaited<ReturnType<typeof requireManagedResort>>, resortId: string, value: unknown) {
  if (!check.ok) {
    return null;
  }

  const roomOfferId = text(value);
  if (!roomOfferId) {
    return null;
  }

  const { data, error } = await check.supabase
    .from("resort_services")
    .select("id")
    .eq("id", roomOfferId)
    .eq("resort_id", resortId)
    .eq("kind", "room")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id as string;
}

async function sanitizeVoucherUpdate(check: Awaited<ReturnType<typeof requireManagedResort>>, resortId: string, body: Record<string, unknown>) {
  return {
    room_offer_id: await roomOfferIdFor(check, resortId, body.roomOfferId),
    guest_name: text(body.guestName),
    guest_contact: text(body.guestContact) || null,
    check_in: text(body.checkIn) || null,
    check_out: text(body.checkOut) || null,
    guests: numberOrNull(body.guests),
    offer_title: text(body.offerTitle) || null,
    room_label: text(body.roomLabel) || null,
    amount_note: text(body.amountNote) || null,
    included_notes: text(body.includedNotes) || null,
    policy_notes: text(body.policyNotes) || null,
    updated_at: new Date().toISOString(),
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id, voucherId } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const payload = await sanitizeVoucherUpdate(check, id, body ?? {});

  if (!payload.guest_name) {
    return NextResponse.json({ error: "Guest name is required." }, { status: 400 });
  }

  const { data: current, error: currentError } = await check.supabase
    .from("booking_vouchers")
    .select("status")
    .eq("id", voucherId)
    .eq("resort_id", id)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: currentError?.message ?? "Voucher not found." }, { status: 404 });
  }

  if (current.status === "void") {
    return NextResponse.json({ error: "Voided vouchers cannot be edited." }, { status: 400 });
  }

  const { data, error } = await check.supabase
    .from("booking_vouchers")
    .update(payload)
    .eq("id", voucherId)
    .eq("resort_id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ voucher: data });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id, voucherId } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const { data: current, error: currentError } = await check.supabase
    .from("booking_vouchers")
    .select("status")
    .eq("id", voucherId)
    .eq("resort_id", id)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: currentError?.message ?? "Voucher not found." }, { status: 404 });
  }

  if (current.status !== "draft") {
    return NextResponse.json({ error: "Only draft vouchers can be deleted. Void issued vouchers instead." }, { status: 400 });
  }

  const { error } = await check.supabase
    .from("booking_vouchers")
    .delete()
    .eq("id", voucherId)
    .eq("resort_id", id)
    .eq("status", "draft");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
