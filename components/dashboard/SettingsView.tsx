import { mockResort } from "@/components/dashboard/mockData";
import { Field, Panel, PrimaryButton } from "@/components/dashboard/ui";

export function SettingsView() {
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
            <Field label="Business Name" value={mockResort.name} />
            <Field label="Location" value={mockResort.location} />
            <Field label="Contact Email" value="hello@villajeruk.com" />
            <Field label="Language" value="English" />
            <Field label="Timezone" value="Asia/Makassar" />
            <Field label="Business Type" value={mockResort.type} />
          </div>
          <div className="mt-6">
            <PrimaryButton>Save settings</PrimaryButton>
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
