"use client";

import { useEffect, useMemo, useState } from "react";
import { DatePickerField, formatDateLabel } from "@/components/dashboard/DatePickerField";
import { Badge, Panel } from "@/components/dashboard/ui";
import { businessCategoryFromType } from "@/lib/business-categories";
import { createVoucherWhatsAppUrl, voucherPublicPath } from "@/lib/vouchers";
import type { BookingVoucher, ResortConsoleData, ResortOfferData, VoucherStatus } from "@/types/dashboard";

const emptyVoucher: Omit<BookingVoucher, "id" | "resortId" | "inquiryId" | "voucherCode" | "publicToken" | "status" | "issuedAt" | "voidedAt" | "createdAt" | "updatedAt"> = {
  roomOfferId: null,
  guestName: "",
  guestContact: "",
  checkIn: "",
  checkOut: "",
  guests: "",
  offerTitle: "",
  roomLabel: "",
  amountNote: "",
  includedNotes: "",
  policyNotes: "",
};

export function VouchersManager({
  site,
  operatorFetch,
}: {
  site: ResortConsoleData;
  operatorFetch: (path: string, init?: RequestInit) => Promise<unknown>;
}) {
  const [vouchers, setVouchers] = useState<BookingVoucher[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyVoucher);
  const [status, setStatus] = useState("Loading vouchers...");
  const [saving, setSaving] = useState(false);

  const selectedVoucher = vouchers.find((voucher) => voucher.id === selectedId) ?? null;
  const category = businessCategoryFromType({ type: site.type, templateId: site.template });
  const accommodation = category.id === "accommodation";
  const roomOptions = useMemo(() => site.services.filter((offer) => offer.kind === "room" && offer.isActive), [site.services]);
  const summary = useMemo(() => ({
    draft: vouchers.filter((voucher) => voucher.status === "draft").length,
    issued: vouchers.filter((voucher) => voucher.status === "issued").length,
    void: vouchers.filter((voucher) => voucher.status === "void").length,
  }), [vouchers]);

  useEffect(() => {
    if (!selectedVoucher) {
      setDraft(emptyVoucher);
      return;
    }

    setDraft({
      roomOfferId: selectedVoucher.roomOfferId,
      guestName: selectedVoucher.guestName,
      guestContact: selectedVoucher.guestContact,
      checkIn: selectedVoucher.checkIn,
      checkOut: selectedVoucher.checkOut,
      guests: selectedVoucher.guests,
      offerTitle: selectedVoucher.offerTitle,
      roomLabel: selectedVoucher.roomLabel,
      amountNote: selectedVoucher.amountNote,
      includedNotes: selectedVoucher.includedNotes,
      policyNotes: selectedVoucher.policyNotes,
    });
  }, [selectedVoucher]);

  async function loadVouchers() {
    setStatus("Loading vouchers...");
    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/vouchers`) as { vouchers?: RawVoucher[] };
      const loaded = (data.vouchers ?? []).map(voucherFromApi);
      setVouchers(loaded);
      setSelectedId((current) => current ?? loaded[0]?.id ?? null);
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load vouchers.");
    }
  }

  useEffect(() => {
    void loadVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id]);

  async function createManualVoucher() {
    setSaving(true);
    setStatus(accommodation ? "Creating voucher..." : "Creating confirmation...");
    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/vouchers`, {
        method: "POST",
        body: JSON.stringify({
          guestName: accommodation ? "Guest name" : "Customer name",
          includedNotes: accommodation ? "Accommodation booking confirmation." : `${category.shortLabel} inquiry confirmation.`,
          policyNotes: accommodation ? "Please contact the business if your arrival time changes." : "Please contact the business if your request details change.",
        }),
      }) as { voucher?: RawVoucher };

      if (data.voucher) {
        const nextVoucher = voucherFromApi(data.voucher);
        setVouchers((current) => [nextVoucher, ...current]);
        setSelectedId(nextVoucher.id);
        setStatus(accommodation ? "Voucher draft created." : "Confirmation draft created.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create voucher.");
    } finally {
      setSaving(false);
    }
  }

  async function saveVoucher() {
    if (!selectedVoucher) {
      return;
    }

    setSaving(true);
    setStatus("Saving voucher...");
    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/vouchers/${selectedVoucher.id}`, {
        method: "PATCH",
        body: JSON.stringify(draft),
      }) as { voucher?: RawVoucher };

      if (data.voucher) {
        const updated = voucherFromApi(data.voucher);
        setVouchers((current) => current.map((voucher) => (voucher.id === updated.id ? updated : voucher)));
        setStatus("Voucher saved.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save voucher.");
    } finally {
      setSaving(false);
    }
  }

  async function updateVoucherStatus(voucher: BookingVoucher, action: "issue" | "void") {
    setSaving(true);
    setStatus(action === "issue" ? "Issuing voucher..." : "Voiding voucher...");
    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/vouchers/${voucher.id}/${action}`, {
        method: "POST",
      }) as { voucher?: RawVoucher };

      if (data.voucher) {
        const updated = voucherFromApi(data.voucher);
        setVouchers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setStatus(action === "issue" ? "Voucher issued. Public link is now active." : "Voucher voided.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update voucher.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDraftVoucher(voucher: BookingVoucher) {
    if (voucher.status !== "draft") {
      return;
    }

    setSaving(true);
    setStatus("Deleting draft voucher...");
    try {
      await operatorFetch(`/api/operator/resorts/${site.id}/vouchers/${voucher.id}`, {
        method: "DELETE",
      });
      setVouchers((current) => {
        const next = current.filter((item) => item.id !== voucher.id);
        setSelectedId(next[0]?.id ?? null);
        return next;
      });
      setStatus("Draft voucher deleted.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete voucher.");
    } finally {
      setSaving(false);
    }
  }

  async function copyPublicLink(voucher: BookingVoucher) {
    const url = `${window.location.origin}${voucherPublicPath(site.slug, voucher.publicToken)}`;
    await navigator.clipboard.writeText(url);
    setStatus("Public voucher link copied.");
  }

  function selectRoomOffer(roomOfferId: string) {
    const room = roomOptions.find((option) => option.id === roomOfferId);
    setDraft((current) => ({
      ...current,
      roomOfferId: room?.id ?? null,
      roomLabel: room?.title ?? "",
      offerTitle: room?.title ?? current.offerTitle,
      amountNote: room?.priceLabel || current.amountNote,
      guests: room?.maxGuests || current.guests,
    }));
  }

  const publicUrl = selectedVoucher ? voucherPublicPath(site.slug, selectedVoucher.publicToken) : "";
  const whatsappUrl = selectedVoucher ? createVoucherWhatsAppUrl(site.whatsappNumber, site.name, publicUrl) : "";
  const isVoided = selectedVoucher?.status === "void";

  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{accommodation ? "Vouchers" : "Confirmations"}</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">{accommodation ? "Booking vouchers" : "Inquiry confirmations"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {accommodation
                ? "Create a guest-facing booking confirmation after a direct inquiry is confirmed."
                : "Create a customer-facing follow-up link after a WhatsApp inquiry is confirmed."}
            </p>
          </div>
          <button type="button" disabled={saving} onClick={() => void createManualVoucher()} className="min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Working..." : accommodation ? "New manual voucher" : "New confirmation"}
          </button>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Draft" value={summary.draft} />
        <SummaryCard label="Issued" value={summary.issued} />
        <SummaryCard label="Void" value={summary.void} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <Panel>
          <h2 className="text-xl font-semibold text-slate-950">{accommodation ? "Voucher list" : "Confirmation list"}</h2>
          <div className="mt-5 grid gap-3">
            {vouchers.length > 0 ? (
              vouchers.map((voucher) => (
                <button
                  key={voucher.id}
                  type="button"
                  onClick={() => setSelectedId(voucher.id)}
                  className={`rounded-lg border p-4 text-left transition ${voucher.id === selectedId ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{voucher.guestName}</p>
                    <Badge tone={toneForStatus(voucher.status)}>{voucher.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{voucher.voucherCode}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {accommodation
                      ? `${voucher.checkIn ? formatDateLabel(voucher.checkIn) : "No check-in"} to ${voucher.checkOut ? formatDateLabel(voucher.checkOut) : "No check-out"}`
                      : voucher.checkIn
                        ? `${category.inquiry.preferredDateLabel}: ${formatDateLabel(voucher.checkIn)}`
                        : `No ${category.inquiry.preferredDateLabel.toLowerCase()}`}
                  </p>
                </button>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                {accommodation ? "No vouchers yet. Create one from a confirmed inquiry or start a manual voucher." : "No confirmations yet. Create one from a confirmed inquiry or start a manual confirmation."}
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          {selectedVoucher ? (
            <div className="grid gap-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-950">{selectedVoucher.voucherCode}</h2>
                    <Badge tone={toneForStatus(selectedVoucher.status)}>{selectedVoucher.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Public link: {selectedVoucher.status === "issued" ? publicUrl : "available after issue"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedVoucher.status === "issued" ? (
                    <>
                      <button type="button" onClick={() => void copyPublicLink(selectedVoucher)} className="min-h-10 rounded-md bg-white px-4 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">Copy link</button>
                      <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-md bg-[#25D366] px-4 text-sm font-semibold text-white">Send WhatsApp</a>
                    </>
                  ) : null}
                  {selectedVoucher.status !== "issued" && selectedVoucher.status !== "void" ? (
                    <button type="button" disabled={saving} onClick={() => void updateVoucherStatus(selectedVoucher, "issue")} className="min-h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60">Issue</button>
                  ) : null}
                  {selectedVoucher.status !== "void" ? (
                    <button type="button" disabled={saving} onClick={() => void updateVoucherStatus(selectedVoucher, "void")} className="min-h-10 rounded-md bg-white px-4 text-sm font-semibold text-red-700 ring-1 ring-red-200 disabled:opacity-60">Void</button>
                  ) : null}
                  {selectedVoucher.status === "draft" ? (
                    <button type="button" disabled={saving} onClick={() => void deleteDraftVoucher(selectedVoucher)} className="min-h-10 rounded-md bg-white px-4 text-sm font-semibold text-red-700 ring-1 ring-red-200 disabled:opacity-60">Delete draft</button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <EditableField label={accommodation ? "Guest name" : "Customer name"} value={draft.guestName} onChange={(guestName) => setDraft((current) => ({ ...current, guestName }))} disabled={isVoided} />
                <EditableField label={accommodation ? "Guest contact" : "Customer contact"} value={draft.guestContact} onChange={(guestContact) => setDraft((current) => ({ ...current, guestContact }))} disabled={isVoided} />
                <DatePickerField label={category.inquiry.preferredDateLabel} value={draft.checkIn} onChange={(checkIn) => setDraft((current) => ({ ...current, checkIn }))} />
                {accommodation ? <DatePickerField label="Check-out" value={draft.checkOut} onChange={(checkOut) => setDraft((current) => ({ ...current, checkOut }))} /> : null}
                <EditableField label={category.inquiry.sizeLabel} type="number" value={draft.guests} onChange={(guests) => setDraft((current) => ({ ...current, guests }))} disabled={isVoided} />
                {accommodation ? <RoomSelect rooms={roomOptions} value={draft.roomOfferId ?? ""} onChange={selectRoomOffer} disabled={isVoided} /> : null}
                <EditableField label="Offer title" value={draft.offerTitle} onChange={(offerTitle) => setDraft((current) => ({ ...current, offerTitle }))} disabled={isVoided} />
                {accommodation ? <EditableField label="Room label" value={draft.roomLabel} onChange={(roomLabel) => setDraft((current) => ({ ...current, roomLabel, roomOfferId: null }))} disabled={isVoided} /> : null}
                <EditableField label="Amount note" value={draft.amountNote} onChange={(amountNote) => setDraft((current) => ({ ...current, amountNote }))} disabled={isVoided} />
              </div>
              <EditableField label="Included notes" value={draft.includedNotes} onChange={(includedNotes) => setDraft((current) => ({ ...current, includedNotes }))} textarea disabled={isVoided} />
              <EditableField label="Policy notes" value={draft.policyNotes} onChange={(policyNotes) => setDraft((current) => ({ ...current, policyNotes }))} textarea disabled={isVoided} />
              <button type="button" disabled={saving || isVoided} onClick={() => void saveVoucher()} className="min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Saving..." : accommodation ? "Save voucher" : "Save confirmation"}
              </button>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              {accommodation ? "Select a voucher to edit guest details and issue a public confirmation link." : "Select a confirmation to edit customer details and issue a public follow-up link."}
            </p>
          )}
          {status ? <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">{status}</p> : null}
        </Panel>
      </div>
    </div>
  );
}

type RawVoucher = {
  id: string;
  resort_id: string;
  inquiry_id: string | null;
  room_offer_id: string | null;
  voucher_code: string;
  public_token: string;
  guest_name: string;
  guest_contact: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  offer_title: string | null;
  room_label: string | null;
  amount_note: string | null;
  included_notes: string | null;
  policy_notes: string | null;
  status: VoucherStatus;
  issued_at: string | null;
  voided_at: string | null;
  created_at: string;
  updated_at: string;
};

function voucherFromApi(voucher: RawVoucher): BookingVoucher {
  return {
    id: voucher.id,
    resortId: voucher.resort_id,
    inquiryId: voucher.inquiry_id,
    roomOfferId: voucher.room_offer_id,
    voucherCode: voucher.voucher_code,
    publicToken: voucher.public_token,
    guestName: voucher.guest_name,
    guestContact: voucher.guest_contact ?? "",
    checkIn: voucher.check_in ?? "",
    checkOut: voucher.check_out ?? "",
    guests: voucher.guests?.toString() ?? "",
    offerTitle: voucher.offer_title ?? "",
    roomLabel: voucher.room_label ?? "",
    amountNote: voucher.amount_note ?? "",
    includedNotes: voucher.included_notes ?? "",
    policyNotes: voucher.policy_notes ?? "",
    status: voucher.status,
    issuedAt: voucher.issued_at,
    voidedAt: voucher.voided_at,
    createdAt: voucher.created_at,
    updatedAt: voucher.updated_at,
  };
}

function toneForStatus(status: VoucherStatus) {
  return status === "issued" ? "green" : status === "void" ? "gray" : "sand";
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Panel>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </Panel>
  );
}

function RoomSelect({
  rooms,
  value,
  onChange,
  disabled,
}: {
  rooms: ResortOfferData[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      Reserved room
      <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400">
        <option value="">Manual room label</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.title}
            {room.priceLabel ? ` · ${room.priceLabel}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditableField({
  label,
  value,
  onChange,
  type = "text",
  textarea,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      {textarea ? (
        <textarea disabled={disabled} value={value} rows={4} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400" />
      ) : (
        <input disabled={disabled} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400" />
      )}
    </label>
  );
}
