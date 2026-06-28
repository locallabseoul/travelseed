import type { ResortConsoleData } from "@/types/dashboard";
import { Badge } from "@/components/dashboard/ui";

export function SiteSwitcher({
  sites,
  selectedSiteId,
  onSiteChange,
}: {
  sites: ResortConsoleData[];
  selectedSiteId: string;
  onSiteChange: (siteId: string) => void;
}) {
  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? sites[0];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Current site</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-950">{selectedSite.name}</h2>
            <Badge tone={selectedSite.status === "Published" ? "green" : selectedSite.status === "Draft" ? "sand" : "gray"}>
              {selectedSite.status}
            </Badge>
            <Badge tone="sand">{selectedSite.plan}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{selectedSite.location}</p>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-slate-950 xl:min-w-72">
          Switch site
          <select
            value={selectedSiteId}
            onChange={(event) => onSiteChange(event.target.value)}
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} · {site.status}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
