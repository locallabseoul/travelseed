"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { DatePickerField } from "@/components/dashboard/DatePickerField";
import { createDefaultBookingMessage, createWhatsAppBookingUrl } from "@/lib/whatsapp";
import type { Resort } from "@/types/resort";

type BookingInquiryFormProps = {
  resort: Resort;
  source?: string;
  buttonClassName?: string;
  buttonStyle?: CSSProperties;
};

const emptyForm = {
  guestName: "",
  guestContact: "",
  checkIn: "",
  checkOut: "",
  guests: "2",
  airportPickup: false,
};

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
