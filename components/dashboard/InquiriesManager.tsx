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
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("Loading inquiries...");
  const [saving, setSaving] = useState(false);

  const category = businessCategoryFromType({ type: site.type, templateId: site.template });
  const dashboardCopy = dashboardCategoryCopyFor(site);
  const accommodation = category.id === "accommodation";
  const selectedInquiry = inquiries.find((inquiry) => inquiry.id === selectedId) ?? inquiries[0] ?? null;
  const filteredInquiries = useMemo(
    () => inquiries.filter((inquiry) => {
      const matchesFilter = activeFilter === "all" ? true : inquiry.status === activeFilter;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [inquiry.guestName, inquiry.guestContact, inquiry.notes, inquiry.source]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesFilter && matchesQuery;
    }),
    [activeFilter, inquiries, query],
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
    <section className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-slate-950">Central Inbox</h1>
          <p className="text-sm text-slate-500">Manage all your WhatsApp leads and inquiries.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            {filterOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setActiveFilter(option)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeFilter === option
                    ? "border border-slate-200 bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {filterLabel(option)}{option === "all" || option === "new" ? ` (${summary[option]})` : ""}
              </button>
            ))}
          </div>
          <label className="relative">
            <InboxIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inquiries..."
              className="min-h-10 w-52 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50" aria-label="Filter inquiries">
            <InboxIcon name="filter" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <div className="flex max-h-[780px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 p-4">
            <span className="text-sm font-semibold text-slate-700">Recent Messages</span>
            <span className="text-xs text-slate-500">Showing {filteredInquiries.length} of {inquiries.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((inquiry) => (
                <button
                  key={inquiry.id}
                  type="button"
                  onClick={() => setSelectedId(inquiry.id)}
                  className={`relative w-full border-b border-slate-100 p-4 text-left transition last:border-b-0 ${
                    inquiry.id === selectedInquiry?.id
                      ? "border-l-4 border-l-emerald-500 bg-emerald-50"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  {inquiry.status === "new" ? <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-emerald-500" /> : null}
                  <div className="mb-2 flex items-start gap-3">
                    <Avatar name={inquiry.guestName} />
                    <div className="min-w-0 flex-1 pr-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <h2 className={`truncate text-sm ${inquiry.status === "new" ? "font-bold text-slate-950" : "font-semibold text-slate-700"}`}>
                          {inquiry.guestName || "Unnamed customer"}
                        </h2>
                        <span className={`shrink-0 text-xs ${inquiry.status === "new" ? "font-medium text-emerald-600" : "text-slate-400"}`}>
                          {relativeTime(inquiry.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{inquiry.guestContact || "No contact saved"}</p>
                    </div>
                  </div>
                  <p className={`mb-3 line-clamp-2 text-sm leading-relaxed ${inquiry.status === "new" ? "text-slate-800" : "text-slate-600"}`}>
                    {inquiry.notes || inquirySummary(inquiry, category)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600">
                      <InboxIcon name="file" className="h-3 w-3" />
                      {sourceLabel(inquiry.source)}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium ${inquiry.status === "confirmed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700"}`}>
                      {statusLabel(inquiry.status)}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <p className="p-5 text-sm leading-6 text-slate-500">No inquiries match this filter.</p>
            )}
          </div>
        </div>

        <div className="grid gap-6">
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
            <div className="flex min-h-[620px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
              Select an inquiry to view the conversation detail.
            </div>
          )}
          {status ? <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm">{status}</p> : null}

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
            <button type="button" disabled={saving} onClick={() => void createInquiry()} className="mt-5 min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "Saving..." : "Save inquiry"}
            </button>
          </Panel>
        </div>
      </div>
    </section>
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
  const primaryDetail = inquiry.checkIn ? formatDateLabel(inquiry.checkIn) : "Not provided";
  const secondaryDetail = accommodation && inquiry.checkOut ? formatDateLabel(inquiry.checkOut) : "";
  const sizeDetail = accommodation ? inquiry.guests || "Not provided" : inquiry.guests || "Open request";

  return (
    <article className="flex min-h-[620px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={inquiry.guestName} size="lg" />
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">{inquiry.guestName || "Unnamed customer"}</h2>
              <Badge tone={toneForStatus(inquiry.status)}>{statusLabel(inquiry.status)}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>{inquiry.guestContact || "No contact saved"}</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
              <span>{sourceLabel(inquiry.source)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            Mark as spam
          </button>
          <select
            value={inquiry.status}
            onChange={(event) => onStatusChange(event.target.value as InquiryStatus)}
            className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {statusLabel(option)}
              </option>
            ))}
          </select>
          {inquiry.status === "confirmed" ? (
            <button type="button" disabled={saving} onClick={onCreateVoucher} className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
              {accommodation ? "Issue voucher" : "Create confirmation"}
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/40 p-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-950">Inquiry Context</h3>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <ContextItem icon="file" label="Source page" value={sourceLabel(inquiry.source)} />
            <ContextItem icon="calendar" label="Timestamp" value={formatFullDate(inquiry.createdAt)} />
            <ContextItem icon="calendar" label={category.inquiry.preferredDateLabel} value={primaryDetail} />
            {accommodation ? <ContextItem icon="calendar" label="Check-out" value={secondaryDetail || "Not provided"} /> : null}
            <ContextItem icon="users" label={category.inquiry.sizeLabel} value={sizeDetail} />
            <ContextItem icon="location" label="Site" value={inquiry.resortId ? "Current site" : "Not linked"} />
          </div>
        </section>

        <section>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Original Message</p>
          <div className="max-w-2xl rounded-2xl rounded-tl-none border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700 shadow-sm">
            <p className="whitespace-pre-line">{inquiry.notes || inquirySummary(inquiry, category)}</p>
          </div>
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {category.inquiry.quickReplies.map((reply, index) => {
            const replyUrl = whatsappReplyUrl(inquiry, reply);
            const label = quickReplyLabels[index] ?? replyLabel(reply);
            return replyUrl ? (
              <a key={reply} href={replyUrl} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                {label}
              </a>
            ) : (
              <span key={reply} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400">
                {label}
              </span>
            );
          })}
        </div>
        <div className="relative">
          <textarea
            rows={3}
            placeholder="Type a reply or select a template..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 pr-32 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            readOnly
          />
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white shadow-sm">
              <InboxIcon name="whatsapp" className="h-4 w-4" />
              Reply
            </a>
          ) : (
            <span className="absolute bottom-3 right-3 inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-400">
              No WhatsApp
            </span>
          )}
        </div>
      </footer>
    </article>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = (name || "Guest")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "G";
  const sizeClass = size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 ${sizeClass}`}>
      {initials}
    </div>
  );
}

function ContextItem({ icon, label, value }: { icon: InboxIconName; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <InboxIcon name={icon} className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 font-semibold text-slate-950">{value}</p>
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

function formatFullDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function relativeTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff)) {
    return "";
  }
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d ago` : formatShortDate(value);
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

type InboxIconName = "calendar" | "file" | "filter" | "location" | "search" | "users" | "whatsapp";

function InboxIcon({ name, className }: { name: InboxIconName; className?: string }) {
  const icons: Record<InboxIconName, React.ReactNode> = {
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </>
    ),
    filter: (
      <>
        <path d="M3 5h18" />
        <path d="M7 12h10" />
        <path d="M10 19h4" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M3 21l1.65-3.8A8 8 0 1 1 7 19.35L3 21Z" />
        <path d="M9 9.5c.4 2 2 3.6 4 4l1.1-1.1a1 1 0 0 1 1-.24c1.1.37 1.9.83 2.4 1.34a1 1 0 0 1 .15 1.21c-.48.78-1.33 1.3-2.25 1.29-4.5-.05-8.35-3.9-8.4-8.4-.01-.92.51-1.77 1.29-2.25a1 1 0 0 1 1.21.15c.51.5.97 1.3 1.34 2.4a1 1 0 0 1-.24 1L9 9.5Z" />
      </>
    ),
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
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
