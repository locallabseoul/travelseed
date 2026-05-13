import { contentSections } from "@/components/dashboard/mockData";
import { Badge, Panel, SecondaryButton } from "@/components/dashboard/ui";

export function ContentManager() {
  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Content</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Site sections</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Manage fixed hospitality sections with simple forms. No drag-and-drop page builder required.</p>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2">
        {contentSections.map((section) => (
          <Panel key={section.title}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-[#18352f]">{section.title}</h2>
                  <Badge tone={section.status === "Ready" ? "green" : section.status === "Needs review" ? "sand" : "gray"}>{section.status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{section.description}</p>
              </div>
              <SecondaryButton>Edit</SecondaryButton>
            </div>
            {section.title === "Hero" ? (
              <div className="mt-5 rounded-2xl bg-[#18352f] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Hero preview</p>
                <h3 className="mt-3 text-2xl font-semibold">Private Tropical Escape in Selong Belanak</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">3-bedroom villa with private pool near Lombok&apos;s most beautiful beaches.</p>
                <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#18352f]">Book Direct on WhatsApp</span>
              </div>
            ) : null}
            {section.title === "Gallery" ? (
              <div className="mt-5 grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="aspect-square rounded-xl bg-gradient-to-br from-[#eadfce] to-[#9eb39f]" />
                ))}
              </div>
            ) : null}
          </Panel>
        ))}
      </div>
    </div>
  );
}
