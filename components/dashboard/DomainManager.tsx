import { useEffect, useState } from "react";
import { Badge, Panel, ProgressBar, SecondaryButton } from "@/components/dashboard/ui";
import type { ResortConsoleData } from "@/types/dashboard";

const dnsRows = [
  { type: "CNAME", name: "www", value: "sites.travelseed.app", status: "Verified" },
  { type: "A Record", name: "@", value: "76.76.21.21", status: "Pending" },
  { type: "TXT Verification", name: "_travelseed", value: "ts-villa-jeruk-verify", status: "Active" },
];

export function DomainManager({
  site,
  onSiteUpdate,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
}) {
  const hasCustomDomain = Boolean(site.customDomain);
  const [slug, setSlug] = useState(site.slug);
  const [customDomain, setCustomDomain] = useState(site.customDomain);

  useEffect(() => {
    setSlug(site.slug);
    setCustomDomain(site.customDomain);
  }, [site.customDomain, site.id, site.slug]);

  async function saveDomainSettings() {
    const normalizedSlug = slug.trim().toLowerCase();
    const normalizedDomain = customDomain.trim().toLowerCase();

    await onSiteUpdate({
      ...site,
      slug: normalizedSlug,
      travelseedUrl: `${normalizedSlug}.travelseed.app`,
      domain: normalizedDomain || null,
      customDomain: normalizedDomain,
    });
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Domain</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Connect your domain</h1>
            <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Keep Travelseed operations behind a branded guest-facing address.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={hasCustomDomain ? "green" : "sand"}>{hasCustomDomain ? "Active" : "Pending"}</Badge>
            <Badge tone={hasCustomDomain ? "sand" : "gray"}>SSL {hasCustomDomain ? "Active" : "Pending"}</Badge>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <EditableField label="Travelseed Slug" value={slug} onChange={setSlug} prefix="https://" suffix=".travelseed.app" />
          <EditableField label="Custom Domain" value={customDomain} onChange={setCustomDomain} placeholder="villajeruk.com" />
        </div>
        <button type="button" onClick={() => void saveDomainSettings()} className="mt-6 min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
          Save domain settings
        </button>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.58fr]">
        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">DNS settings</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#eadfce]">
            {dnsRows.map((row) => (
              <div key={row.type} className="grid gap-3 border-b border-[#eadfce] bg-white p-4 last:border-b-0 md:grid-cols-[0.8fr_0.8fr_1.4fr_0.7fr]">
                <p className="text-sm font-semibold text-[#18352f]">{row.type}</p>
                <p className="text-sm text-[#6f7b74]">{row.name}</p>
                <p className="break-all text-sm text-[#6f7b74]">{row.value}</p>
                <Badge tone={row.status === "Active" || row.status === "Verified" ? "green" : "sand"}>{row.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Connection health</h2>
          <div className="mt-6 grid gap-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>DNS</span>
                <span>70%</span>
              </div>
              <ProgressBar value={70} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>SSL</span>
                <span>100%</span>
              </div>
              <ProgressBar value={100} />
            </div>
            <SecondaryButton>Recheck DNS</SecondaryButton>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      <div className="flex min-h-11 overflow-hidden rounded-xl border border-[#d8cebb] bg-white focus-within:border-[#18352f]">
        {prefix ? <span className="flex items-center bg-[#fbfaf7] px-3 text-sm text-[#6f7b74]">{prefix}</span> : null}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 px-3 text-sm outline-none"
        />
        {suffix ? <span className="flex items-center bg-[#fbfaf7] px-3 text-sm text-[#6f7b74]">{suffix}</span> : null}
      </div>
    </label>
  );
}
