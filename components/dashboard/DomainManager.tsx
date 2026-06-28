import { useEffect, useState } from "react";
import { Badge, Panel, ProgressBar } from "@/components/dashboard/ui";
import type { DashboardUnsavedChanges, ResortConsoleData } from "@/types/dashboard";
import type { Resort } from "@/types/resort";

function dnsRowsFor(site: ResortConsoleData) {
  return [
    { type: "CNAME", name: "www", value: "sites.travelseed.app", status: site.domainStatus === "active" || site.domainStatus === "verified" ? "Verified" : "Pending" },
    { type: "A Record", name: "@", value: "76.76.21.21", status: site.domainStatus === "active" || site.domainStatus === "verified" ? "Verified" : "Pending" },
    { type: "TXT Verification", name: "_travelseed", value: `ts-${site.slug}-verify`, status: site.customDomain ? "Active" : "Not set" },
  ];
}

export function DomainManager({
  site,
  onSiteUpdate,
  operatorFetch,
  onUnsavedChangesChange,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  operatorFetch: (path: string, init?: RequestInit) => Promise<unknown>;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
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

  const isDirty = slug !== site.slug || customDomain !== site.customDomain;

  useEffect(() => {
    onUnsavedChangesChange?.({
      isDirty,
      title: "Discard domain changes?",
      description: "You have domain settings that have not been saved. Continue without saving them?",
    });

    return () => onUnsavedChangesChange?.({ isDirty: false, title: "", description: "" });
  }, [isDirty, onUnsavedChangesChange]);

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
  const dnsRows = dnsRowsFor(site);

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Domain</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Connect your domain</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Put your WhatsApp-ready business site behind a branded customer-facing address.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={site.domainStatus === "active" || site.domainStatus === "verified" ? "green" : hasCustomDomain ? "sand" : "gray"}>{labelForStatus(site.domainStatus)}</Badge>
            <Badge tone={site.sslStatus === "active" ? "green" : hasCustomDomain ? "sand" : "gray"}>SSL {labelForStatus(site.sslStatus)}</Badge>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <EditableField label="Travelseed Slug" value={slug} onChange={setSlug} prefix="https://" suffix=".travelseed.app" />
          <EditableField label="Custom Domain" value={customDomain} onChange={setCustomDomain} placeholder="yourbusiness.com" />
        </div>
        <button type="button" onClick={() => void saveDomainSettings()} className="mt-6 min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm">
          Save domain settings
        </button>
        {status ? <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">{status}</p> : null}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.58fr]">
        <Panel>
          <h2 className="text-xl font-semibold text-slate-950">DNS settings</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Add these records at your domain provider, then recheck DNS when propagation starts.</p>
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            {dnsRows.map((row) => (
              <div key={row.type} className="grid gap-3 border-b border-slate-200 bg-white p-4 last:border-b-0 md:grid-cols-[0.8fr_0.8fr_1.4fr_0.7fr]">
                <p className="text-sm font-semibold text-slate-950">{row.type}</p>
                <p className="text-sm text-slate-600">{row.name}</p>
                <p className="break-all text-sm text-slate-600">{row.value}</p>
                <Badge tone={statusTone(row.status)}>{row.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-slate-950">Connection health</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Track DNS and SSL readiness before sending customers to the custom URL.</p>
          <div className="mt-6 grid gap-5">
            <div>
              <div className="mb-2 flex justify-between text-sm text-slate-600">
                <span>DNS</span>
                <span className="font-semibold text-slate-950">{dnsProgress}%</span>
              </div>
              <ProgressBar value={dnsProgress} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm text-slate-600">
                <span>SSL</span>
                <span className="font-semibold text-slate-950">{sslProgress}%</span>
              </div>
              <ProgressBar value={sslProgress} />
            </div>
            <button type="button" onClick={() => void recheckDns()} className="min-h-11 rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
              Recheck DNS
            </button>
            {site.domainVerifiedAt ? <p className="text-xs text-slate-500">Last verified {formatDateTime(site.domainVerifiedAt)}</p> : null}
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
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      <div className="flex min-h-11 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
        {prefix ? <span className="flex items-center bg-slate-50 px-3 text-sm text-slate-500">{prefix}</span> : null}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 px-3 text-sm outline-none"
        />
        {suffix ? <span className="flex items-center bg-slate-50 px-3 text-sm text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  );
}
