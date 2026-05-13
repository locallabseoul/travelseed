import { useEffect, useState } from "react";
import { Badge, Panel, ProgressBar } from "@/components/dashboard/ui";
import type { ResortConsoleData } from "@/types/dashboard";
import type { Resort } from "@/types/resort";

const dnsRows = [
  { type: "CNAME", name: "www", value: "sites.travelseed.app", status: "Verified" },
  { type: "A Record", name: "@", value: "76.76.21.21", status: "Pending" },
  { type: "TXT Verification", name: "_travelseed", value: "ts-villa-jeruk-verify", status: "Active" },
];

export function DomainManager({
  site,
  onSiteUpdate,
  operatorFetch,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  operatorFetch: (path: string, init?: RequestInit) => Promise<unknown>;
}) {
  const hasCustomDomain = Boolean(site.customDomain);
  const [slug, setSlug] = useState(site.slug);
  const [customDomain, setCustomDomain] = useState(site.customDomain);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setSlug(site.slug);
    setCustomDomain(site.customDomain);
    setStatus("");
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
      domainStatus: normalizedDomain === site.customDomain ? site.domainStatus : normalizedDomain ? "pending" : "not_connected",
      sslStatus: normalizedDomain === site.customDomain ? site.sslStatus : "pending",
      domainVerifiedAt: normalizedDomain === site.customDomain ? site.domainVerifiedAt : null,
    });
  }

  async function recheckDns() {
    setStatus("Rechecking DNS...");
    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/domain/recheck`, { method: "POST" }) as { resort?: Resort };
      const resort = data.resort;

      if (!resort) {
        throw new Error("Could not read domain status.");
      }

      await onSiteUpdate({
        ...site,
        domainStatus: resort.domain_status ?? site.domainStatus,
        sslStatus: resort.ssl_status ?? site.sslStatus,
        domainVerifiedAt: resort.domain_verified_at ?? null,
      });
      setStatus("DNS status updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not recheck DNS.");
    }
  }

  const dnsProgress = site.domainStatus === "active" || site.domainStatus === "verified" ? 100 : hasCustomDomain ? 55 : 0;
  const sslProgress = site.sslStatus === "active" ? 100 : hasCustomDomain ? 50 : 0;

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
            <Badge tone={site.domainStatus === "active" || site.domainStatus === "verified" ? "green" : hasCustomDomain ? "sand" : "gray"}>{labelForStatus(site.domainStatus)}</Badge>
            <Badge tone={site.sslStatus === "active" ? "green" : hasCustomDomain ? "sand" : "gray"}>SSL {labelForStatus(site.sslStatus)}</Badge>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <EditableField label="Travelseed Slug" value={slug} onChange={setSlug} prefix="https://" suffix=".travelseed.app" />
          <EditableField label="Custom Domain" value={customDomain} onChange={setCustomDomain} placeholder="villajeruk.com" />
        </div>
        <button type="button" onClick={() => void saveDomainSettings()} className="mt-6 min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
          Save domain settings
        </button>
        {status ? <p className="mt-4 rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#52615a]">{status}</p> : null}
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
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
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
                <span>{dnsProgress}%</span>
              </div>
              <ProgressBar value={dnsProgress} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>SSL</span>
                <span>{sslProgress}%</span>
              </div>
              <ProgressBar value={sslProgress} />
            </div>
            <button type="button" onClick={() => void recheckDns()} className="min-h-11 rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
              Recheck DNS
            </button>
            {site.domainVerifiedAt ? <p className="text-xs text-[#6f7b74]">Last verified {formatDateTime(site.domainVerifiedAt)}</p> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function labelForStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: string) {
  return status === "Active" || status === "Verified" ? "green" : status === "Pending" ? "sand" : "gray";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
