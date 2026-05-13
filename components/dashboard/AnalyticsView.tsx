import { Panel, ProgressBar } from "@/components/dashboard/ui";

const topSections = [
  { label: "Hero", value: 92 },
  { label: "Gallery", value: 68 },
  { label: "Rooms", value: 47 },
  { label: "Experiences", value: 36 },
  { label: "Booking CTA", value: 29 },
];

const events = [
  "WhatsApp CTA clicked from Hero",
  "Gallery opened on mobile",
  "Domain visit from Google Search",
  "Booking CTA clicked from Footer",
];

export function AnalyticsView() {
  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Direct booking signal</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7b74]">Simple performance indicators for non-technical operators.</p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Page Views", "1,240"],
          ["WhatsApp Clicks", "32"],
          ["CTA Conversion", "2.6%"],
          ["Avg. Time", "1m 42s"],
        ].map(([label, value]) => (
          <Panel key={label}>
            <p className="text-sm text-[#6f7b74]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#18352f]">{value}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Top sections</h2>
          <div className="mt-6 grid gap-5">
            {topSections.map((section) => (
              <div key={section.label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-[#18352f]">{section.label}</span>
                  <span className="text-[#6f7b74]">{section.value}%</span>
                </div>
                <ProgressBar value={section.value} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Recent click events</h2>
          <div className="mt-5 grid gap-3">
            {events.map((event, index) => (
              <div key={event} className="rounded-2xl bg-[#fbfaf7] p-4">
                <p className="text-sm font-semibold text-[#18352f]">{event}</p>
                <p className="mt-1 text-xs text-[#6f7b74]">{index + 2} hours ago</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
