import { useEffect, useState } from "react";
import { contentSections } from "@/components/dashboard/mockData";
import { Badge, Panel, SecondaryButton } from "@/components/dashboard/ui";
import type { ContentSection, ResortConsoleData } from "@/types/dashboard";

type EditableSection = "Hero" | "About" | "Features" | "Gallery" | "Rooms / Services" | "Experiences" | "Booking CTA";

function isEditableSection(title: ContentSection["title"]): title is EditableSection {
  return ["Hero", "About", "Features", "Gallery", "Rooms / Services", "Experiences", "Booking CTA"].includes(title);
}

export function ContentManager({
  site,
  onSiteUpdate,
}: {
  site: ResortConsoleData;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
}) {
  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [heroTitle, setHeroTitle] = useState(site.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(site.heroSubtitle);
  const [heroCta, setHeroCta] = useState(site.heroCta);
  const [about, setAbout] = useState(site.about);
  const [features, setFeatures] = useState(site.features.join("\n"));
  const [gallery, setGallery] = useState(site.gallery.join("\n"));
  const [experiences, setExperiences] = useState(site.experiences.join("\n"));
  const [bookingMessageTemplate, setBookingMessageTemplate] = useState(site.bookingMessageTemplate);

  useEffect(() => {
    setEditingSection(null);
    setHeroTitle(site.heroTitle);
    setHeroSubtitle(site.heroSubtitle);
    setHeroCta(site.heroCta);
    setAbout(site.about);
    setFeatures(site.features.join("\n"));
    setGallery(site.gallery.join("\n"));
    setExperiences(site.experiences.join("\n"));
    setBookingMessageTemplate(site.bookingMessageTemplate);
  }, [site.about, site.bookingMessageTemplate, site.experiences, site.features, site.gallery, site.heroCta, site.heroSubtitle, site.heroTitle, site.id]);

  function startEditing(section: EditableSection) {
    setEditingSection(section);
    setHeroTitle(site.heroTitle);
    setHeroSubtitle(site.heroSubtitle);
    setHeroCta(site.heroCta);
    setAbout(site.about);
    setFeatures(site.features.join("\n"));
    setGallery(site.gallery.join("\n"));
    setExperiences(site.experiences.join("\n"));
    setBookingMessageTemplate(site.bookingMessageTemplate);
  }

  async function saveSection() {
    const nextFeatures = features.split("\n").map((item) => item.trim()).filter(Boolean);

    await onSiteUpdate({
      ...site,
      heroTitle,
      heroSubtitle,
      heroCta,
      about,
      features: nextFeatures,
      gallery: gallery.split("\n").map((item) => item.trim()).filter(Boolean),
      experiences: experiences.split("\n").map((item) => item.trim()).filter(Boolean),
      bookingMessageTemplate,
    });
    setEditingSection(null);
  }

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
              {isEditableSection(section.title) ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isEditableSection(section.title)) {
                      startEditing(section.title);
                    }
                  }}
                  className="min-h-11 rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]"
                >
                  Edit
                </button>
              ) : (
                <SecondaryButton>Edit</SecondaryButton>
              )}
            </div>
            {section.title === "Hero" ? (
              <div className="mt-5 rounded-2xl bg-[#18352f] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Hero preview</p>
                <h3 className="mt-3 text-2xl font-semibold">{site.heroTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{site.heroSubtitle}</p>
                <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#18352f]">{site.heroCta}</span>
              </div>
            ) : null}
            {section.title === "About" ? <p className="mt-5 rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#52615a]">{site.about}</p> : null}
            {section.title === "Features" ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {site.features.map((feature) => (
                  <span key={feature} className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold text-[#18352f]">{feature}</span>
                ))}
              </div>
            ) : null}
            {section.title === "Experiences" ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {site.experiences.map((experience) => (
                  <span key={experience} className="rounded-full bg-[#e6f0e7] px-3 py-1 text-xs font-semibold text-[#1f5a45]">{experience}</span>
                ))}
              </div>
            ) : null}
            {section.title === "Gallery" ? (
              <div className="mt-5 grid grid-cols-4 gap-2">
                {site.gallery.length > 0
                  ? site.gallery.slice(0, 8).map((imageUrl, index) => (
                      <div
                        key={imageUrl}
                        className="aspect-square rounded-xl bg-cover bg-center shadow-sm"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                        aria-label={`${site.name} gallery image ${index + 1}`}
                      />
                    ))
                  : Array.from({ length: 8 }, (_, index) => (
                      <div key={index} className="aspect-square rounded-xl bg-gradient-to-br from-[#eadfce] to-[#9eb39f]" />
                    ))}
              </div>
            ) : null}
            {section.title === "Rooms / Services" ? (
              <div className="mt-5 grid gap-2">
                {site.features.slice(0, 4).map((feature) => (
                  <div key={feature} className="rounded-2xl bg-[#fbfaf7] p-3 text-sm font-semibold text-[#18352f]">{feature}</div>
                ))}
              </div>
            ) : null}
            {section.title === "Booking CTA" ? (
              <div className="mt-5 rounded-2xl bg-[#18352f] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">WhatsApp message</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/78">{site.bookingMessageTemplate}</p>
              </div>
            ) : null}
          </Panel>
        ))}
      </div>

      {editingSection ? (
        <Panel className="border-[#2d6b50]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Editing</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#18352f]">{editingSection}</h2>
            </div>
            <button type="button" onClick={() => setEditingSection(null)} className="text-sm font-semibold text-[#6f7b74]">
              Cancel
            </button>
          </div>
          <div className="mt-5 grid gap-4">
            {editingSection === "Hero" ? (
              <>
                <EditableField label="Hero title" value={heroTitle} onChange={setHeroTitle} />
                <EditableField label="Hero subtitle" value={heroSubtitle} onChange={setHeroSubtitle} textarea />
                <EditableField label="CTA label" value={heroCta} onChange={setHeroCta} />
              </>
            ) : null}
            {editingSection === "About" ? <EditableField label="About copy" value={about} onChange={setAbout} textarea /> : null}
            {editingSection === "Features" ? <EditableField label="Features, one per line" value={features} onChange={setFeatures} textarea /> : null}
            {editingSection === "Gallery" ? <EditableField label="Gallery image URLs, one per line" value={gallery} onChange={setGallery} textarea rows={8} /> : null}
            {editingSection === "Rooms / Services" ? (
              <>
                <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#52615a]">
                  Rooms and services currently use the same saved highlights as Features. A dedicated room database can be added later when reservation management is built.
                </p>
                <EditableField label="Rooms / services highlights, one per line" value={features} onChange={setFeatures} textarea rows={8} />
              </>
            ) : null}
            {editingSection === "Experiences" ? <EditableField label="Experiences, one per line" value={experiences} onChange={setExperiences} textarea /> : null}
            {editingSection === "Booking CTA" ? <EditableField label="WhatsApp booking message template" value={bookingMessageTemplate} onChange={setBookingMessageTemplate} textarea rows={8} /> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => void saveSection()} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
                Save changes
              </button>
            </div>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  textarea,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      {textarea ? (
        <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
      )}
    </label>
  );
}
