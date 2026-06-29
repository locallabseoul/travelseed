import { useEffect, useMemo, useState } from "react";
import { DatePickerField, formatDateLabel } from "@/components/dashboard/DatePickerField";
import { Badge, Panel } from "@/components/dashboard/ui";
import { businessCategoryFromType } from "@/lib/business-categories";
import { dashboardCategoryCopyFor } from "@/lib/dashboard-category-copy";
import type { BookingInquiry, DashboardTab, InquiryStatus, ResortConsoleData } from "@/types/dashboard";

const statusOptions: InquiryStatus[] = ["new", "contacted", "confirmed", "cancelled"];
const filterOptions: Array<"all" | InquiryStatus> = ["all", ...statusOptions];

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
  onTabChange,
  onNotificationsRefresh,
}: {
  site: ResortConsoleData;
  operatorFetch: (path: string, init?: RequestInit) => Promise<unknown>;
  onTabChange?: (tab: DashboardTab) => void;
  onNotificationsRefresh?: () => void;
}) {
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | InquiryStatus>("all");
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("Loading inquiries...");
  const [saving, setSaving] = useState(false);

  const category = businessCategoryFromType({ type: site.type, templateId: site.template });
  const dashboardCopy = dashboardCategoryCopyFor(site);
  const accommodation = category.id === "accommodation";
  const selectedInquiry = inquiries.find((inquiry) => inquiry.id === selectedId) ?? inquiries[0] ?? null;
  const filteredInquiries = useMemo(
    () => inquiries.filter((inquiry) => (activeFilter === "all" ? true : inquiry.status === activeFilter)),
    [activeFilter, inquiries],
  );
  const summary = useMemo(
    () => ({
      all: inquiries.length,
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
      const loadedInquiries = (data.inquiries ?? []).map(inquiryFromApi);
      setInquiries(loadedInquiries);
      setSelectedId((current) => current ?? loadedInquiries[0]?.id ?? null);
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
        const nextInquiry = inquiryFromApi(data.inquiry);
        setInquiries((current) => [nextInquiry, ...current]);
        setSelectedId(nextInquiry.id);
      }
      onNotificationsRefresh?.();
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
      onNotificationsRefresh?.();
      setStatus("Inquiry updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update inquiry.");
    }
  }

  async function createVoucherFromInquiry(inquiry: BookingInquiry) {
    setSaving(true);
    setStatus(accommodation ? "Creating voucher draft..." : "Creating confirmation draft...");
    try {
      await operatorFetch(`/api/operator/resorts/${site.id}/vouchers`, {
        method: "POST",
        body: JSON.stringify({ inquiryId: inquiry.id }),
      });
      setStatus(accommodation ? "Voucher draft is ready." : "Confirmation draft is ready.");
      onTabChange?.("vouchers");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : accommodation ? "Could not create voucher." : "Could not create confirmation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Inquiries</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Central Inbox</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Track WhatsApp-ready customer conversations, manual requests, and confirmed follow-ups in one operating inbox.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {filterOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setActiveFilter(option)}
                className={`min-h-9 rounded-md px-3 text-sm font-semibold transition ${
                  activeFilter === option
                    ? "border border-slate-200 bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {filterLabel(option)} ({summary[option]})
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Panel className="p-0">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-950">Inbox queue</h2>
            <p className="mt-1 text-sm text-slate-500">{filteredInquiries.length} visible conversations</p>
          </div>
          <div className="grid max-h-[680px] overflow-y-auto">
            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((inquiry) => (
                <button
                  key={inquiry.id}
                  type="button"
                  onClick={() => setSelectedId(inquiry.id)}
                  className={`border-b border-slate-100 p-4 text-left transition last:border-b-0 ${
                    inquiry.id === selectedInquiry?.id ? "bg-emerald-50/70" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{inquiry.guestName || "Unnamed customer"}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{inquiry.guestContact || "No contact saved"}</p>
                    </div>
                    <Badge tone={toneForStatus(inquiry.status)}>{statusLabel(inquiry.status)}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">{inquiry.notes || inquirySummary(inquiry, category)}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                    <span>{sourceLabel(inquiry.source)}</span>
                    <span>{formatShortDate(inquiry.createdAt)}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="p-5 text-sm leading-6 text-slate-500">No inquiries match this filter.</p>
            )}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel>
            {selectedInquiry ? (
              <InquiryDetail
                inquiry={selectedInquiry}
                category={category}
                quickReplyLabels={dashboardCopy.inquiries.quickReplyLabels}
                saving={saving}
                onStatusChange={(nextStatus) => void updateStatus(selectedInquiry, nextStatus)}
                onCreateVoucher={() => void createVoucherFromInquiry(selectedInquiry)}
              />
            ) : (
              <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Select an inquiry to view the conversation detail.
              </div>
            )}
            {status ? <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{status}</p> : null}
          </Panel>

          <Panel>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Log manual inquiry</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Use this for walk-ins, calls, Instagram DMs, or WhatsApp chats that were not captured by the site.</p>
              </div>
              <Badge tone="gray">Manual</Badge>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Customer name" value={form.guestName} onChange={(guestName) => setForm((current) => ({ ...current, guestName }))} />
              <Field label="Customer contact" value={form.guestContact} onChange={(guestContact) => setForm((current) => ({ ...current, guestContact }))} />
              {accommodation ? (
                <>
                  <DatePickerField label="Check-in" value={form.checkIn} onChange={(checkIn) => setForm((current) => ({ ...current, checkIn }))} />
                  <DatePickerField label="Check-out" value={form.checkOut} onChange={(checkOut) => setForm((current) => ({ ...current, checkOut }))} />
                  <Field label="Guests" type="number" value={form.guests} onChange={(guests) => setForm((current) => ({ ...current, guests }))} />
                </>
              ) : (
                <>
                  <DatePickerField label={category.inquiry.preferredDateLabel} value={form.checkIn} onChange={(checkIn) => setForm((current) => ({ ...current, checkIn }))} />
                  <Field label={category.inquiry.sizeLabel} type="number" value={form.guests} onChange={(guests) => setForm((current) => ({ ...current, guests }))} />
                </>
              )}
              <div className={accommodation ? "md:col-span-2" : ""}>
                <Field label="Request notes" value={form.notes} onChange={(notes) => setForm((current) => ({ ...current, notes }))} textarea />
              </div>
            </div>
            <button type="button" disabled={saving} onClick={() => void createInquiry()} className="mt-5 min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : "Save inquiry"}
            </button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function InquiryDetail({
  inquiry,
  category,
  quickReplyLabels,
  saving,
  onStatusChange,
  onCreateVoucher,
}: {
  inquiry: BookingInquiry;
  category: ReturnType<typeof businessCategoryFromType>;
  quickReplyLabels: string[];
  saving: boolean;
  onStatusChange: (status: InquiryStatus) => void;
  onCreateVoucher: () => void;
}) {
  const accommodation = category.id === "accommodation";
  const whatsappUrl = whatsappReplyUrl(inquiry, category.inquiry.quickReplies[0]);

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-slate-950">{inquiry.guestName || "Unnamed customer"}</h2>
            <Badge tone={toneForStatus(inquiry.status)}>{statusLabel(inquiry.status)}</Badge>
            <Badge tone="gray">{sourceLabel(inquiry.source)}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-500">{inquiry.guestContact || "No contact saved"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={inquiry.status}
            onChange={(event) => onStatusChange(event.target.value as InquiryStatus)}
            className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {statusLabel(option)}
              </option>
            ))}
          </select>
          {inquiry.status === "confirmed" ? (
            <button type="button" disabled={saving} onClick={onCreateVoucher} className="min-h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
              {accommodation ? "Issue voucher" : "Create confirmation"}
            </button>
          ) : null}
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-md bg-[#25D366] px-4 text-sm font-semibold text-white shadow-sm">
              Reply on WhatsApp
            </a>
          ) : (
            <span className="inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-400">
              No WhatsApp number
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <DetailCard label={category.inquiry.preferredDateLabel} value={inquiry.checkIn ? formatDateLabel(inquiry.checkIn) : "Not provided"} />
        {accommodation ? <DetailCard label="Check-out" value={inquiry.checkOut ? formatDateLabel(inquiry.checkOut) : "Not provided"} /> : null}
        <DetailCard label={category.inquiry.sizeLabel} value={accommodation ? inquiry.guests || "Not provided" : inquiry.guests || "Open request"} />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Original message</p>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{inquiry.notes || "No notes saved yet."}</p>
      </section>

      <section className="mt-6">
        <p className="text-sm font-semibold text-slate-950">Quick replies</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {category.inquiry.quickReplies.map((reply, index) => {
            const replyUrl = whatsappReplyUrl(inquiry, reply);
            const label = quickReplyLabels[index] ?? replyLabel(reply);
            return replyUrl ? (
              <a key={reply} href={replyUrl} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                {label}
              </a>
            ) : (
              <span key={reply} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400">
                {label}
              </span>
            );
          })}
        </div>
      </section>
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

function filterLabel(option: "all" | InquiryStatus) {
  return option === "all" ? "All" : statusLabel(option);
}

function statusLabel(status: InquiryStatus) {
  const labels: Record<InquiryStatus, string> = {
    new: "New",
    contacted: "Replied",
    confirmed: "Confirmed",
    cancelled: "Closed",
  };
  return labels[status];
}

function sourceLabel(source: string) {
  if (source === "booking_cta" || source === "booking_form") {
    return "Website form";
  }
  if (source === "manual") {
    return "Manual";
  }
  return source
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inquirySummary(inquiry: BookingInquiry, category: ReturnType<typeof businessCategoryFromType>) {
  if (category.id === "accommodation") {
    return `${inquiry.checkIn ? formatDateLabel(inquiry.checkIn) : "No check-in"} to ${inquiry.checkOut ? formatDateLabel(inquiry.checkOut) : "No check-out"} · ${inquiry.guests || "?"} guests`;
  }
  return inquiry.checkIn ? `${category.inquiry.preferredDateLabel}: ${formatDateLabel(inquiry.checkIn)}` : category.inquiry.summaryFallback;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function whatsappReplyUrl(inquiry: BookingInquiry, message: string) {
  const digits = inquiry.guestContact.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (digits.length < 8) {
    return "";
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function replyLabel(reply: string) {
  if (reply.includes("preferred date")) return "Ask preferred time";
  if (reply.includes("pricing")) return "Send pricing info";
  if (reply.includes("current offer")) return "Share offer";
  return "Confirm follow-up";
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
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
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      {textarea ? (
        <textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
      )}
    </label>
  );
}
