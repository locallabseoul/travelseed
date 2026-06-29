import { useEffect, useState } from "react";
import { Badge, Panel } from "@/components/dashboard/ui";
import { businessCategoryFromType } from "@/lib/business-categories";
import { dashboardCategoryCopyFor } from "@/lib/dashboard-category-copy";
import { createWhatsAppBookingUrl } from "@/lib/whatsapp";
import type { DashboardUnsavedChanges, ResortConsoleData } from "@/types/dashboard";

const languageOptions = ["English", "Bahasa Indonesia"] as const;

function defaultBookingTemplate(siteName: string, airportPickupEnabled = true, category = businessCategoryFromType(null)) {
  const lines = category.defaultBookingMessage(siteName).split("\n");
  if (airportPickupEnabled && !templateHasAirportPickup(lines.join("\n"))) {
    lines.push("Additional notes:");
  }

  return lines.join("\n");
}

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function templateHasAirportPickup(template: string) {
  return /airport pickup|additional notes/i.test(template);
}

function applyAirportPickup(template: string, enabled: boolean) {
  const lines = template.split("\n").filter((line) => !/airport pickup|additional notes/i.test(line));
  return enabled ? [...lines, "Additional notes:"].join("\n") : lines.join("\n");
}

export function WhatsAppManager({
  site,
  onSiteUpdate,
  onUnsavedChangesChange,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
}) {
  const [whatsappNumber, setWhatsappNumber] = useState(site.whatsappNumber);
  const [language, setLanguage] = useState(site.language);
  const category = businessCategoryFromType({ type: site.type, templateId: site.template });
  const dashboardCopy = dashboardCategoryCopyFor(site);
  const [bookingMessageTemplate, setBookingMessageTemplate] = useState(site.bookingMessageTemplate || defaultBookingTemplate(site.name, true, category));
  const [airportPickupEnabled, setAirportPickupEnabled] = useState(templateHasAirportPickup(site.bookingMessageTemplate || ""));
  const availablePresets = dashboardCopy.whatsapp.presets;

  useEffect(() => {
    setWhatsappNumber(site.whatsappNumber);
    setLanguage(site.language);
    setBookingMessageTemplate(site.bookingMessageTemplate || defaultBookingTemplate(site.name, true, category));
    setAirportPickupEnabled(templateHasAirportPickup(site.bookingMessageTemplate || defaultBookingTemplate(site.name, true, category)));
  }, [category, site.bookingMessageTemplate, site.id, site.language, site.name, site.whatsappNumber]);

  const normalizedNumber = normalizeWhatsAppNumber(whatsappNumber);
  const testBookingUrl = normalizedNumber ? createWhatsAppBookingUrl(normalizedNumber, bookingMessageTemplate) : "";
  const isDirty = normalizedNumber !== site.whatsappNumber ||
    language !== site.language ||
    bookingMessageTemplate !== site.bookingMessageTemplate;

  useEffect(() => {
    onUnsavedChangesChange?.({
      isDirty,
      title: "Discard WhatsApp changes?",
      description: "You have inquiry message or WhatsApp settings that have not been saved. Continue without saving them?",
    });

    return () => onUnsavedChangesChange?.({ isDirty: false, title: "", description: "" });
  }, [isDirty, onUnsavedChangesChange]);

  async function saveSettings() {
    await onSiteUpdate({ ...site, whatsappNumber: normalizedNumber, language, bookingMessageTemplate });
  }

  function toggleAirportPickup(enabled: boolean) {
    setAirportPickupEnabled(enabled);
    setBookingMessageTemplate((currentTemplate) => applyAirportPickup(currentTemplate, enabled));
  }

  function applyPreset(fields: string[]) {
    const nextTemplate = [`Hello, I would like to inquire about ${site.name}.`, ...fields].join("\n");
    setAirportPickupEnabled(templateHasAirportPickup(nextTemplate));
    setBookingMessageTemplate(nextTemplate);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active number" value={normalizedNumber || "Not set"} helper="Destination for customer inquiries" />
        <StatCard label="WhatsApp clicks" value={site.whatsappClicksUsed.toLocaleString()} helper={`${site.whatsappClicksLimit.toLocaleString()} monthly plan limit`} />
        <StatCard label="Customer inquiries" value={site.inquiriesUsed.toLocaleString()} helper={site.inquiriesLimit ? `${site.inquiriesLimit.toLocaleString()} monthly plan limit` : "Unlimited on current plan"} />
        <StatCard label="Template status" value={bookingMessageTemplate.trim() ? "Ready" : "Draft"} helper="Used by public inquiry forms" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">WhatsApp</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">WhatsApp inquiry settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Configure the guided WhatsApp message that customers send from the public inquiry form.</p>
          </div>
          <Badge tone={normalizedNumber ? "green" : "gray"}>{normalizedNumber ? "Connected" : "Not set"}</Badge>
        </div>
        <div className="mt-6 grid gap-5">
          <EditableField label="WhatsApp Number" value={whatsappNumber} onChange={setWhatsappNumber} helper={normalizedNumber ? `Saved as ${normalizedNumber}` : "Use country code, for example 6282147901202."} />
          <div className="grid gap-3">
            <p className="text-sm font-medium text-slate-950">Message preset</p>
            <div className="flex flex-wrap gap-2">
              {availablePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.fields)}
                  className="min-h-10 rounded-md bg-slate-50 px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-white hover:text-slate-950"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <EditableField label="Inquiry Message Template" value={bookingMessageTemplate} onChange={setBookingMessageTemplate} textarea />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Language" value={language} options={languageOptions} onChange={setLanguage} />
            <ToggleField label={dashboardCopy.whatsapp.additionalFieldLabel} enabled={airportPickupEnabled} onChange={toggleAirportPickup} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => void saveSettings()} className="min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm">
              Save WhatsApp settings
            </button>
            {testBookingUrl ? (
              <a href={testBookingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
                Test WhatsApp link
              </a>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Chat preview</h2>
            <p className="mt-1 text-sm text-slate-600">This is the message customers will send from the live WhatsApp button.</p>
          </div>
          <Badge tone="green">{language}</Badge>
        </div>
        <div className="mt-5 rounded-lg bg-slate-100 p-4">
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">{site.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <p className="text-sm font-semibold text-slate-950">{site.name}</p>
                <p className="text-xs text-slate-500">Typically replies in minutes</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="max-w-[88%] rounded-lg rounded-bl-sm bg-slate-100 p-3 text-sm leading-6 text-slate-800">
                {bookingMessageTemplate.split("\n").map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
              <div className="ml-auto max-w-[80%] rounded-lg rounded-br-sm bg-emerald-600 p-3 text-sm text-white">
                {dashboardCopy.whatsapp.previewReply}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-4">
            <span>Destination number</span>
            <span className="font-semibold text-slate-950">{normalizedNumber || "Not set"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Tracking readiness</span>
            <span className="font-semibold text-slate-950">Ready for click event API</span>
          </div>
        </div>
      </Panel>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Panel>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 break-words text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </Panel>
  );
}

function EditableField({
  label,
  value,
  onChange,
  textarea,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  helper?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      {textarea ? (
        <textarea value={value} rows={5} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
      )}
      {helper ? <span className="text-xs font-normal text-slate-500">{helper}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <div className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`flex min-h-11 items-center justify-between rounded-xl border px-3 text-sm font-semibold ${
          enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"
        }`}
      >
        {enabled ? "Enabled" : "Disabled"}
        <span className={`h-6 w-11 rounded-full p-1 transition ${enabled ? "bg-emerald-600" : "bg-slate-300"}`}>
          <span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} />
        </span>
      </button>
    </div>
  );
}
