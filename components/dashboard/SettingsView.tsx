import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/ui";
import type { ResortConsoleData } from "@/types/dashboard";

export function SettingsView({
  site,
  onSiteUpdate,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => void;
}) {
  const [name, setName] = useState(site.name);
  const [location, setLocation] = useState(site.location);
  const [contactEmail, setContactEmail] = useState(site.contactEmail);
  const [language, setLanguage] = useState(site.language);
  const [timezone, setTimezone] = useState(site.timezone);
  const [type, setType] = useState(site.type);

  useEffect(() => {
    setName(site.name);
    setLocation(site.location);
    setContactEmail(site.contactEmail);
    setLanguage(site.language);
    setTimezone(site.timezone);
    setType(site.type);
  }, [site.contactEmail, site.id, site.language, site.location, site.name, site.timezone, site.type]);

  function saveSettings() {
    onSiteUpdate({ ...site, name, location, contactEmail, language, timezone, type });
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Business settings</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Central settings for the operator account and direct booking site.</p>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.58fr]">
        <Panel>
          <div className="grid gap-5 md:grid-cols-2">
            <EditableField label="Business Name" value={name} onChange={setName} />
            <EditableField label="Location" value={location} onChange={setLocation} />
            <EditableField label="Contact Email" value={contactEmail} onChange={setContactEmail} />
            <EditableField label="Language" value={language} onChange={setLanguage} />
            <EditableField label="Timezone" value={timezone} onChange={setTimezone} />
            <EditableField label="Business Type" value={type} onChange={setType} />
          </div>
          <div className="mt-6">
            <button type="button" onClick={saveSettings} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
              Apply mock changes
            </button>
            <p className="mt-3 text-xs leading-5 text-[#6f7b74]">TODO: Persist business settings to Supabase when DB integration starts.</p>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-red-800">Danger Zone</h2>
          <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Placeholder for account export, pause site, and delete workflows. These actions should require confirmation after DB integration.</p>
          <button type="button" className="mt-6 min-h-11 rounded-full bg-red-50 px-5 text-sm font-semibold text-red-700 ring-1 ring-red-200">
            Pause site
          </button>
        </Panel>
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
    </label>
  );
}
