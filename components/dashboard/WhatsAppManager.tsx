import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/ui";
import type { ResortConsoleData } from "@/types/dashboard";

function bookingTemplate(siteName: string) {
  return `Hello, I would like to make a reservation at ${siteName}.
Check-in:
Check-out:
Guests:
Airport Pickup:`;
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

  useEffect(() => {
    setWhatsappNumber(site.whatsappNumber);
    setLanguage(site.language);
  }, [site.id, site.language, site.whatsappNumber]);

  async function saveSettings() {
    await onSiteUpdate({ ...site, whatsappNumber, language });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">WhatsApp</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Booking settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Configure the guided WhatsApp message that guests send from the direct booking site.</p>
        <div className="mt-6 grid gap-5">
          <EditableField label="WhatsApp Number" value={whatsappNumber} onChange={setWhatsappNumber} />
          <EditableField label="Default Message" value={`Hello, I would like to book ${site.name}.`} onChange={() => undefined} />
          <EditableField label="Booking Message Template" value={bookingTemplate(site.name)} onChange={() => undefined} textarea />
          <div className="grid gap-4 sm:grid-cols-2">
            <EditableField label="Language" value={language} onChange={setLanguage} />
            <EditableField label="Airport Pickup Option" value="Enabled" onChange={() => undefined} />
          </div>
          <button type="button" onClick={() => void saveSettings()} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
            Save WhatsApp settings
          </button>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-xl font-semibold text-[#18352f]">Chat preview</h2>
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
                Hello, I would like to make a reservation at {site.name}.
                <br />Check-in:
                <br />Check-out:
                <br />Guests:
                <br />Airport Pickup:
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[#2d6b50] p-3 text-sm text-white">
                Thanks. Please send your dates and guest count.
              </div>
            </div>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      {textarea ? (
        <textarea value={value} readOnly rows={4} className="rounded-xl border border-[#d8cebb] bg-[#fbfaf7] px-3 py-3 text-sm leading-6 outline-none" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
      )}
    </label>
  );
}
