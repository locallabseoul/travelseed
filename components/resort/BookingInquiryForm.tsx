"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { DatePickerField } from "@/components/dashboard/DatePickerField";
import { createDefaultBookingMessage, createWhatsAppBookingUrl } from "@/lib/whatsapp";
import type { Resort } from "@/types/resort";

type BookingInquiryFormProps = {
  resort: Resort;
  source?: string;
  buttonClassName?: string;
  buttonStyle?: CSSProperties;
};

type BookingInquiryModalProps = BookingInquiryFormProps & {
  triggerLabel?: ReactNode;
  triggerAriaLabel?: string;
};

const emptyForm = {
  guestName: "",
  guestContact: "",
  checkIn: "",
  checkOut: "",
  guests: "2",
  airportPickup: false,
};

export function BookingInquiryModal({
  resort,
  source = "booking_form",
  buttonClassName = "",
  buttonStyle,
  triggerLabel = "Book on WhatsApp",
  triggerAriaLabel,
}: BookingInquiryModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={triggerAriaLabel}
        className={`inline-flex min-h-14 items-center justify-center px-7 text-base font-semibold ${buttonClassName}`}
        style={buttonStyle}
      >
        {triggerLabel}
      </button>
      {open && mounted ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#10241f]/70 px-4 py-6 backdrop-blur-sm">
          <button type="button" aria-label="Close booking form" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default" />
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 text-[#18352f] shadow-[0_28px_100px_rgba(16,36,31,0.34)] sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#eadfce] pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#72815e]">Direct booking</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#18352f]">Check dates on WhatsApp</h2>
                <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Share your stay details and continue the reservation conversation with the host.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbfaf7] text-xl font-semibold text-[#18352f] ring-1 ring-[#eadfce]">
                x
              </button>
            </div>
            <div className="mt-5">
              <BookingInquiryForm resort={resort} source={source} buttonClassName={buttonClassName} buttonStyle={buttonStyle} />
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

export function BookingInquiryForm({
  resort,
  source = "booking_form",
  buttonClassName = "",
  buttonStyle,
}: BookingInquiryFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const message = useMemo(() => buildBookingMessage(resort, form), [form, resort]);
  const bookingUrl = createWhatsAppBookingUrl(resort.whatsapp_number, message);

  async function handleBookingClick() {
    setStatus("Opening WhatsApp and saving inquiry...");
    const payload = JSON.stringify({
      resortId: resort.id,
      source,
      inquiry: {
        guestName: form.guestName.trim() || "Website WhatsApp guest",
        guestContact: form.guestContact.trim(),
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: form.guests,
        notes: message,
      },
    });

    try {
      await fetch("/api/events/whatsapp-click", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
        keepalive: true,
      });
      setStatus("Inquiry saved. Continue in WhatsApp.");
    } catch {
      setStatus("WhatsApp opened. Inquiry tracking may be delayed.");
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Your name" value={form.guestName} placeholder="Guest name" onChange={(guestName) => setForm((current) => ({ ...current, guestName }))} />
        <Field label="Contact" value={form.guestContact} placeholder="Email or phone" onChange={(guestContact) => setForm((current) => ({ ...current, guestContact }))} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DatePickerField label="Check-in" value={form.checkIn} onChange={(checkIn) => setForm((current) => ({ ...current, checkIn }))} />
        <DatePickerField label="Check-out" value={form.checkOut} onChange={(checkOut) => setForm((current) => ({ ...current, checkOut }))} />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Guests" type="number" value={form.guests} placeholder="2" onChange={(guests) => setForm((current) => ({ ...current, guests }))} />
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm font-semibold text-[#18352f]">
          Airport pickup
          <input type="checkbox" checked={form.airportPickup} onChange={(event) => setForm((current) => ({ ...current, airportPickup: event.target.checked }))} />
        </label>
      </div>
      <a
        href={bookingUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => void handleBookingClick()}
        className={`inline-flex min-h-14 w-full items-center justify-center px-7 text-base font-semibold ${buttonClassName}`}
        style={buttonStyle}
      >
        Book on WhatsApp
      </a>
      {status ? <p className="text-xs font-medium text-[#6f7b74]">{status}</p> : null}
    </div>
  );
}

function buildBookingMessage(resort: Resort, form: typeof emptyForm) {
  const base = resort.booking_message_template || createDefaultBookingMessage(resort.name);
  const values: Record<string, string> = {
    "Guest Name": form.guestName,
    "Contact": form.guestContact,
    "Check-in": form.checkIn,
    "Check-out": form.checkOut,
    "Guests": form.guests,
    "Airport Pickup": form.airportPickup ? "Yes" : "No",
  };

  const lines = base.split("\n").map((line) => {
    const key = Object.keys(values).find((field) => line.toLowerCase().startsWith(field.toLowerCase()));
    if (!key || !values[key]) {
      return line;
    }
    return `${key}: ${values[key]}`;
  });

  return [...lines, "", `Guest Name: ${form.guestName || "-"}`, `Contact: ${form.guestContact || "-"}`].join("\n");
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#18352f]">
      {label}
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
    </label>
  );
}
