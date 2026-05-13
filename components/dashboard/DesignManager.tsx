import { colorThemes, mockResort, templateOptions } from "@/components/dashboard/mockData";
import { Badge, Panel, SecondaryButton } from "@/components/dashboard/ui";

export function DesignManager() {
  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Design</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Brand style</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Choose a guided template and simple brand settings that fit hospitality operators.</p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-4">
        {templateOptions.map((template) => (
          <Panel key={template.name} className={template.selected ? "ring-2 ring-[#2d6b50]" : ""}>
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[#eadfce] via-[#f8f5ef] to-[#2d6b50]/45" />
            <div className="mt-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-[#18352f]">{template.name}</h2>
              {template.selected ? <Badge>Current</Badge> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{template.description}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Brand assets</h2>
          <div className="mt-5 grid gap-5">
            <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-[#cbbda9] bg-[#fbfaf7] text-sm font-medium text-[#6f7b74]">
              Logo upload placeholder
            </div>
            <div>
              <p className="text-sm font-semibold text-[#18352f]">Color theme</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {colorThemes.map((theme) => (
                  <button key={theme} type="button" className="min-h-12 rounded-xl bg-[#f8f5ef] px-3 text-left text-sm font-semibold text-[#18352f] ring-1 ring-[#eadfce]">
                    {theme}
                  </button>
                ))}
              </div>
            </div>
            <SecondaryButton>Save design settings</SecondaryButton>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-[#18352f]">Responsive preview</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.48fr]">
            <div className="overflow-hidden rounded-2xl border border-[#eadfce] bg-[#18352f] p-5 text-white">
              <div className="h-44 rounded-xl bg-gradient-to-br from-[#9eb39f] to-[#eadfce]" />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">{mockResort.type}</p>
              <h3 className="mt-2 text-2xl font-semibold">{mockResort.name}</h3>
              <p className="mt-2 text-sm text-white/70">{mockResort.location}</p>
            </div>
            <div className="mx-auto w-44 overflow-hidden rounded-[2rem] border-8 border-[#18352f] bg-white p-3 shadow-sm">
              <div className="h-28 rounded-2xl bg-gradient-to-br from-[#9eb39f] to-[#eadfce]" />
              <p className="mt-4 text-xs font-semibold text-[#72815e]">Villa</p>
              <h3 className="mt-1 text-lg font-semibold text-[#18352f]">Book direct</h3>
              <div className="mt-4 h-9 rounded-full bg-[#18352f]" />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
