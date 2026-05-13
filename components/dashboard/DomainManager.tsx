import { mockResort } from "@/components/dashboard/mockData";
import { Badge, Field, Panel, ProgressBar, SecondaryButton } from "@/components/dashboard/ui";

const dnsRows = [
  { type: "CNAME", name: "www", value: "sites.travelseed.app", status: "Verified" },
  { type: "A Record", name: "@", value: "76.76.21.21", status: "Pending" },
  { type: "TXT Verification", name: "_travelseed", value: "ts-villa-jeruk-verify", status: "Active" },
];

export function DomainManager() {
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
            <Badge>Active</Badge>
            <Badge tone="sand">SSL Active</Badge>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Current Travelseed URL" value={mockResort.travelseedUrl} />
          <Field label="Custom Domain" value={mockResort.customDomain} />
        </div>
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
