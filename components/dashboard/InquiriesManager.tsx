import { useEffect, useMemo, useState } from "react";
import { DatePickerField, formatDateLabel } from "@/components/dashboard/DatePickerField";
import { Badge, Panel } from "@/components/dashboard/ui";
import type { BookingInquiry, InquiryStatus, ResortConsoleData } from "@/types/dashboard";

const statusOptions: InquiryStatus[] = ["new", "contacted", "confirmed", "cancelled"];

const emptyForm = {
  guestName: "",
  guestContact: "",
  checkIn: "",
  checkOut: "",
  guests: "",
  notes: "",
};

export function InquiriesManager({
  site,
  operatorFetch,
}: {
  site: ResortConsoleData;
  operatorFetch: (path: string, init?: RequestInit) => Promise<unknown>;
}) {
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("Loading inquiries...");
  const [saving, setSaving] = useState(false);

  const summary = useMemo(
    () => ({
      new: inquiries.filter((inquiry) => inquiry.status === "new").length,
      contacted: inquiries.filter((inquiry) => inquiry.status === "contacted").length,
      confirmed: inquiries.filter((inquiry) => inquiry.status === "confirmed").length,
      cancelled: inquiries.filter((inquiry) => inquiry.status === "cancelled").length,
    }),
    [inquiries],
  );

  async function loadInquiries() {
    setStatus("Loading inquiries...");
    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/inquiries`) as { inquiries?: RawInquiry[] };
      setInquiries((data.inquiries ?? []).map(inquiryFromApi));
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load inquiries.");
    }
  }

  useEffect(() => {
    void loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id]);

  async function createInquiry() {
    setSaving(true);
    setStatus("Saving inquiry...");
    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/inquiries`, {
        method: "POST",
        body: JSON.stringify({ ...form, status: "new", source: "manual" }),
      }) as { inquiry?: RawInquiry };

      if (data.inquiry) {
        setInquiries((current) => [inquiryFromApi(data.inquiry as RawInquiry), ...current]);
      }
      setForm(emptyForm);
      setStatus("Inquiry saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save inquiry.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(inquiry: BookingInquiry, nextStatus: InquiryStatus) {
    setStatus("Updating inquiry...");
    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/inquiries/${inquiry.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      }) as { inquiry?: RawInquiry };

      if (data.inquiry) {
        const updatedInquiry = inquiryFromApi(data.inquiry);
        setInquiries((current) => current.map((item) => (item.id === updatedInquiry.id ? updatedInquiry : item)));
      }
      setStatus("Inquiry updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update inquiry.");
    }
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Inquiries</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Booking CRM</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Track direct booking conversations from WhatsApp and manual requests in a simple operating list.</p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-4">
        {statusOptions.map((option) => (
          <Panel key={option}>
            <p className="text-sm capitalize text-[#6f7b74]">{option}</p>
            <p className="mt-3 text-3xl font-semibold text-[#18352f]">{summary[option]}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.74fr_1.26fr]">
        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Add inquiry</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Guest name" value={form.guestName} onChange={(guestName) => setForm((current) => ({ ...current, guestName }))} />
            <Field label="Guest contact" value={form.guestContact} onChange={(guestContact) => setForm((current) => ({ ...current, guestContact }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <DatePickerField label="Check-in" value={form.checkIn} onChange={(checkIn) => setForm((current) => ({ ...current, checkIn }))} />
              <DatePickerField label="Check-out" value={form.checkOut} onChange={(checkOut) => setForm((current) => ({ ...current, checkOut }))} />
            </div>
            <Field label="Guests" type="number" value={form.guests} onChange={(guests) => setForm((current) => ({ ...current, guests }))} />
            <Field label="Notes" value={form.notes} onChange={(notes) => setForm((current) => ({ ...current, notes }))} textarea />
            <button type="button" disabled={saving} onClick={() => void createInquiry()} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : "Save inquiry"}
            </button>
            {status ? <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#52615a]">{status}</p> : null}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Inquiry pipeline</h2>
          <div className="mt-5 grid gap-3">
            {inquiries.length > 0 ? (
              inquiries.map((inquiry) => (
                <article key={inquiry.id} className="rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-[#18352f]">{inquiry.guestName}</h3>
                        <Badge tone={toneForStatus(inquiry.status)}>{inquiry.status}</Badge>
                        <Badge tone="gray">{sourceLabel(inquiry.source)}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-[#6f7b74]">{inquiry.guestContact || "No contact saved"}</p>
                      <p className="mt-2 text-sm text-[#52615a]">
                        {inquiry.checkIn ? formatDateLabel(inquiry.checkIn) : "No check-in"} to {inquiry.checkOut ? formatDateLabel(inquiry.checkOut) : "No check-out"} · {inquiry.guests || "?"} guests
                      </p>
                      {inquiry.notes ? <p className="mt-3 text-sm leading-6 text-[#52615a]">{inquiry.notes}</p> : null}
                    </div>
                    <select value={inquiry.status} onChange={(event) => void updateStatus(inquiry, event.target.value as InquiryStatus)} className="min-h-10 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]">
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#6f7b74]">No inquiries yet.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

type RawInquiry = {
  id: string;
  resort_id: string;
  guest_name: string;
  guest_contact: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  status: InquiryStatus;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function inquiryFromApi(inquiry: RawInquiry): BookingInquiry {
  return {
    id: inquiry.id,
    resortId: inquiry.resort_id,
    guestName: inquiry.guest_name,
    guestContact: inquiry.guest_contact ?? "",
    checkIn: inquiry.check_in ?? "",
    checkOut: inquiry.check_out ?? "",
    guests: inquiry.guests?.toString() ?? "",
    status: inquiry.status,
    source: inquiry.source,
    notes: inquiry.notes ?? "",
    createdAt: inquiry.created_at,
    updatedAt: inquiry.updated_at,
  };
}

function toneForStatus(status: InquiryStatus) {
  return status === "confirmed" ? "green" : status === "cancelled" ? "gray" : "sand";
}

function sourceLabel(source: string) {
  return source === "booking_cta" || source === "booking_form" ? "WhatsApp form" : source;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      {textarea ? (
        <textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
      )}
    </label>
  );
}
