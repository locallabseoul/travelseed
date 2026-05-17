import { NextResponse } from "next/server";
import { requireManagedResort } from "@/lib/server/operator-resorts";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BookingInquiryRow = {
  id: string;
  resort_id: string;
  guest_name: string;
  guest_contact: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  notes: string | null;
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

function randomCode() {
  return `TS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function randomPublicToken() {
  return crypto.randomUUID().replaceAll("-", "");
}

async function voucherPayload(check: Awaited<ReturnType<typeof requireManagedResort>>, body: Record<string, unknown>, resortId: string, inquiry?: BookingInquiryRow) {
  const guestName = text(body.guestName) || inquiry?.guest_name || "";

  return {
    resort_id: resortId,
    inquiry_id: inquiry?.id ?? null,
    room_offer_id: await roomOfferIdFor(check, resortId, body.roomOfferId),
    voucher_code: randomCode(),
    public_token: randomPublicToken(),
    guest_name: guestName,
    guest_contact: text(body.guestContact) || inquiry?.guest_contact || null,
    check_in: text(body.checkIn) || inquiry?.check_in || null,
    check_out: text(body.checkOut) || inquiry?.check_out || null,
    guests: numberOrNull(body.guests) ?? inquiry?.guests ?? null,
    offer_title: text(body.offerTitle) || null,
    room_label: text(body.roomLabel) || null,
    amount_note: text(body.amountNote) || null,
    included_notes: text(body.includedNotes) || null,
    policy_notes: text(body.policyNotes) || null,
    status: "draft",
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const { data, error } = await check.supabase
    .from("booking_vouchers")
    .select("*")
    .eq("resort_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ vouchers: data ?? [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const check = await requireManagedResort(request, id);
  if (!check.ok) {
    return check.response;
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const inquiryId = text(body?.inquiryId);
  let inquiry: BookingInquiryRow | undefined;

  if (inquiryId) {
    const { data: existingVoucher, error: existingError } = await check.supabase
      .from("booking_vouchers")
      .select("*")
      .eq("resort_id", id)
      .eq("inquiry_id", inquiryId)
      .neq("status", "void")
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingVoucher) {
      return NextResponse.json({ voucher: existingVoucher, existing: true });
    }

    const { data, error } = await check.supabase
      .from("booking_inquiries")
      .select("*")
      .eq("id", inquiryId)
      .eq("resort_id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Inquiry not found." }, { status: 404 });
    }

    inquiry = data as BookingInquiryRow;
  }

  const payload = await voucherPayload(check, body ?? {}, id, inquiry);
  if (!payload.guest_name) {
    return NextResponse.json({ error: "Guest name is required." }, { status: 400 });
  }

  const { data, error } = await check.supabase.from("booking_vouchers").insert(payload).select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ voucher: data });
}
