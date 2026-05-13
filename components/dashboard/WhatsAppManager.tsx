import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/ui";
import { createWhatsAppBookingUrl } from "@/lib/whatsapp";
import type { ResortConsoleData } from "@/types/dashboard";

const languageOptions = ["English", "Bahasa Indonesia", "Korean"] as const;

const messagePresets = [
  { label: "Standard stay", fields: ["Check-in:", "Check-out:", "Guests:", "Airport Pickup:"] },
  { label: "Villa inquiry", fields: ["Preferred dates:", "Guests:", "Special request:", "Airport Pickup:"] },
  { label: "Surf camp", fields: ["Arrival date:", "Nights:", "Surf level:", "Airport Pickup:"] },
];

function defaultBookingTemplate(siteName: string, airportPickupEnabled = true) {
  const fields = ["Check-in:", "Check-out:", "Guests:"];
  if (airportPickupEnabled) {
    fields.push("Airport Pickup:");
  }

  return [`Hello, I would like to make a reservation at ${siteName}.`, ...fields].join("\n");
}

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function templateHasAirportPickup(template: string) {
  return /airport pickup/i.test(template);
}

function applyAirportPickup(template: string, enabled: boolean) {
  const lines = template.split("\n").filter((line) => !/airport pickup/i.test(line));
  return enabled ? [...lines, "Airport Pickup:"].join("\n") : lines.join("\n");
}

export function WhatsAppManager({
  site,
  onSiteUpdate,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
}) {
  const [whatsappNumber, setWhatsappNumber] = useState(site.whatsappNumber);
  const [language, setLanguage] = useState(site.language);
  const [bookingMessageTemplate, setBookingMessageTemplate] = useState(site.bookingMessageTemplate || defaultBookingTemplate(site.name));
  const [airportPickupEnabled, setAirportPickupEnabled] = useState(templateHasAirportPickup(site.bookingMessageTemplate || ""));

  useEffect(() => {
    setWhatsappNumber(site.whatsappNumber);
    setLanguage(site.language);
    setBookingMessageTemplate(site.bookingMessageTemplate || defaultBookingTemplate(site.name));
    setAirportPickupEnabled(templateHasAirportPickup(site.bookingMessageTemplate || defaultBookingTemplate(site.name)));
  }, [site.bookingMessageTemplate, site.id, site.language, site.name, site.whatsappNumber]);

  const normalizedNumber = normalizeWhatsAppNumber(whatsappNumber);
  const testBookingUrl = normalizedNumber ? createWhatsAppBookingUrl(normalizedNumber, bookingMessageTemplate) : "";

  async function saveSettings() {
    await onSiteUpdate({ ...site, whatsappNumber: normalizedNumber, language, bookingMessageTemplate });
  }

  function toggleAirportPickup(enabled: boolean) {
    setAirportPickupEnabled(enabled);
    setBookingMessageTemplate((currentTemplate) => applyAirportPickup(currentTemplate, enabled));
  }

  function applyPreset(fields: string[]) {
    const nextTemplate = [`Hello, I would like to make a reservation at ${site.name}.`, ...fields].join("\n");
    setAirportPickupEnabled(templateHasAirportPickup(nextTemplate));
    setBookingMessageTemplate(nextTemplate);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">WhatsApp</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Booking settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Configure the guided WhatsApp message that guests send from the direct booking site.</p>
        <div className="mt-6 grid gap-5">
          <EditableField label="WhatsApp Number" value={whatsappNumber} onChange={setWhatsappNumber} helper={normalizedNumber ? `Saved as ${normalizedNumber}` : "Use country code, for example 6282147901202."} />
          <div className="grid gap-3">
            <p className="text-sm font-medium text-[#18352f]">Message preset</p>
            <div className="flex flex-wrap gap-2">
              {messagePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.fields)}
                  className="min-h-10 rounded-full bg-[#fbfaf7] px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb] transition hover:bg-white"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <EditableField label="Booking Message Template" value={bookingMessageTemplate} onChange={setBookingMessageTemplate} textarea />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Language" value={language} options={languageOptions} onChange={setLanguage} />
            <ToggleField label="Airport Pickup Option" enabled={airportPickupEnabled} onChange={toggleAirportPickup} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => void saveSettings()} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
              Save WhatsApp settings
            </button>
            {testBookingUrl ? (
              <a href={testBookingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
                Test booking link
              </a>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#18352f]">Chat preview</h2>
            <p className="mt-1 text-sm text-[#6f7b74]">This is the message guests will send from the live booking button.</p>
          </div>
          <span className="rounded-full bg-[#e6f0e7] px-3 py-1 text-xs font-semibold text-[#1f5a45]">{language}</span>
        </div>
        <div className="mt-5 rounded-[2rem] bg-[#e8f0e6] p-4">
          <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#e8eee6] pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2d6b50] text-sm font-bold text-white">{site.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <p className="text-sm font-semibold text-[#18352f]">{site.name}</p>
                <p className="text-xs text-[#6f7b74]">Typically replies in minutes</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-[#f0f4ef] p-3 text-sm leading-6 text-[#18352f]">
                {bookingMessageTemplate.split("\n").map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[#2d6b50] p-3 text-sm text-white">
                Thanks. Please send your dates and guest count.
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 rounded-2xl bg-[#fbfaf7] p-4 text-sm text-[#52615a]">
          <div className="flex items-center justify-between gap-4">
            <span>Destination number</span>
            <span className="font-semibold text-[#18352f]">{normalizedNumber || "Not set"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Tracking readiness</span>
            <span className="font-semibold text-[#18352f]">Ready for click event API</span>
          </div>
        </div>
      </Panel>
    </div>
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
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      {textarea ? (
        <textarea value={value} rows={5} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
      )}
      {helper ? <span className="text-xs font-normal text-[#6f7b74]">{helper}</span> : null}
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
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]">
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
    <div className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`flex min-h-11 items-center justify-between rounded-xl border px-3 text-sm font-semibold ${
          enabled ? "border-[#2d6b50] bg-[#e6f0e7] text-[#1f5a45]" : "border-[#d8cebb] bg-white text-[#6f7b74]"
        }`}
      >
        {enabled ? "Enabled" : "Disabled"}
        <span className={`h-6 w-11 rounded-full p-1 transition ${enabled ? "bg-[#2d6b50]" : "bg-[#c9cfc8]"}`}>
          <span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} />
        </span>
      </button>
    </div>
  );
}
