import { useEffect, useState } from "react";
import { contentSections } from "@/components/dashboard/mockData";
import { Badge, Panel, SecondaryButton } from "@/components/dashboard/ui";
import type { ContentSection, ResortConsoleData, ResortServiceData } from "@/types/dashboard";
import type { ResortService } from "@/types/resort";

type EditableSection = "Hero" | "About" | "Features" | "Gallery" | "Rooms / Services" | "Experiences" | "Booking CTA";

function isEditableSection(title: ContentSection["title"]): title is EditableSection {
  return ["Hero", "About", "Features", "Gallery", "Rooms / Services", "Experiences", "Booking CTA"].includes(title);
}

export function ContentManager({
  site,
  accessToken,
  onSiteUpdate,
}: {
  site: ResortConsoleData;
  accessToken: string | null;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
}) {
  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [heroTitle, setHeroTitle] = useState(site.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(site.heroSubtitle);
  const [heroCta, setHeroCta] = useState(site.heroCta);
  const [about, setAbout] = useState(site.about);
  const [features, setFeatures] = useState(site.features.join("\n"));
  const [services, setServices] = useState<ResortServiceData[]>(site.services);
  const [gallery, setGallery] = useState(site.gallery.join("\n"));
  const [experiences, setExperiences] = useState(site.experiences.join("\n"));
  const [bookingMessageTemplate, setBookingMessageTemplate] = useState(site.bookingMessageTemplate);
  const [uploading, setUploading] = useState<"hero" | "gallery" | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    setEditingSection(null);
    setHeroTitle(site.heroTitle);
    setHeroSubtitle(site.heroSubtitle);
    setHeroCta(site.heroCta);
    setAbout(site.about);
    setFeatures(site.features.join("\n"));
    setServices(site.services);
    setGallery(site.gallery.join("\n"));
    setExperiences(site.experiences.join("\n"));
    setBookingMessageTemplate(site.bookingMessageTemplate);
  }, [site.about, site.bookingMessageTemplate, site.experiences, site.features, site.gallery, site.heroCta, site.heroSubtitle, site.heroTitle, site.id, site.services]);

  function startEditing(section: EditableSection) {
    setEditingSection(section);
    setHeroTitle(site.heroTitle);
    setHeroSubtitle(site.heroSubtitle);
    setHeroCta(site.heroCta);
    setAbout(site.about);
    setFeatures(site.features.join("\n"));
    setServices(site.services);
    setGallery(site.gallery.join("\n"));
    setExperiences(site.experiences.join("\n"));
    setBookingMessageTemplate(site.bookingMessageTemplate);
    setUploadStatus("");
  }

  async function uploadImage(file: File, folder: "hero" | "gallery") {
    if (!accessToken) {
      throw new Error("Sign in before uploading images.");
    }

    const formData = new FormData();
    formData.set("file", file, file.name);
    formData.set("folder", folder);
    formData.set("slug", site.slug);

    const response = await fetch("/api/operator/images", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error ?? "Image upload failed.");
    }

    return String(data.publicUrl);
  }

  async function uploadHeroImage(file: File) {
    setUploading("hero");
    setUploadStatus("Uploading hero image...");
    try {
      const publicUrl = await uploadImage(file, "hero");
      await onSiteUpdate({ ...site, heroImageUrl: publicUrl });
      setUploadStatus("Hero image uploaded and saved.");
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Hero image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function uploadGalleryImages(files: FileList) {
    setUploading("gallery");
    setUploadStatus(`Uploading ${files.length} gallery image${files.length > 1 ? "s" : ""}...`);
    try {
      const uploadedUrls = await Promise.all(Array.from(files).map((file) => uploadImage(file, "gallery")));
      const nextGallery = [...gallery.split("\n").map((item) => item.trim()).filter(Boolean), ...uploadedUrls];
      setGallery(nextGallery.join("\n"));
      await onSiteUpdate({ ...site, gallery: nextGallery });
      setUploadStatus("Gallery images uploaded and saved.");
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Gallery upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function removeGalleryImage(imageUrl: string) {
    const nextGallery = gallery.split("\n").map((item) => item.trim()).filter(Boolean).filter((item) => item !== imageUrl);
    setGallery(nextGallery.join("\n"));
    await onSiteUpdate({ ...site, gallery: nextGallery });
  }

  async function useGalleryImageAsHero(imageUrl: string) {
    await onSiteUpdate({ ...site, heroImageUrl: imageUrl });
    setUploadStatus("Hero image updated from gallery.");
  }

  async function saveSection() {
    const nextFeatures = features.split("\n").map((item) => item.trim()).filter(Boolean);

    if (editingSection === "Rooms / Services") {
      const savedServices = await saveServices();
      await onSiteUpdate({ ...site, services: savedServices });
      setEditingSection(null);
      return;
    }

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

  async function saveServices() {
    if (!accessToken) {
      throw new Error("Sign in before saving rooms or services.");
    }

    const response = await fetch(`/api/operator/resorts/${site.id}/services`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        services: services.map((service, index) => ({
          kind: service.kind,
          title: service.title,
          description: service.description,
          price_label: service.priceLabel,
          capacity: service.capacity ? Number(service.capacity) : null,
          image_url: service.imageUrl,
          sort_order: index,
          is_active: service.isActive,
        })),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error ?? "Could not save rooms or services.");
    }

    return ((data.services ?? []) as ResortService[]).map(serviceFromApi);
  }

  function updateService(index: number, patch: Partial<ResortServiceData>) {
    setServices((currentServices) => currentServices.map((service, serviceIndex) => (serviceIndex === index ? { ...service, ...patch } : service)));
  }

  function addService() {
    setServices((currentServices) => [
      ...currentServices,
      {
        id: `draft-${Date.now()}`,
        kind: "room",
        title: "",
        description: "",
        priceLabel: "",
        capacity: "",
        imageUrl: "",
        sortOrder: currentServices.length,
        isActive: true,
      },
    ]);
  }

  function removeService(index: number) {
    setServices((currentServices) => currentServices.filter((_, serviceIndex) => serviceIndex !== index));
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
                {site.services.length > 0
                  ? site.services.slice(0, 4).map((service) => (
                      <div key={service.id} className="rounded-2xl bg-[#fbfaf7] p-3">
                        <p className="text-sm font-semibold text-[#18352f]">{service.title}</p>
                        <p className="mt-1 text-xs text-[#6f7b74]">{service.priceLabel || service.kind}</p>
                      </div>
                    ))
                  : site.features.slice(0, 4).map((feature) => (
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
                <HeroImagePanel imageUrl={site.heroImageUrl} uploading={uploading === "hero"} onUpload={uploadHeroImage} />
                <EditableField label="Hero title" value={heroTitle} onChange={setHeroTitle} />
                <EditableField label="Hero subtitle" value={heroSubtitle} onChange={setHeroSubtitle} textarea />
                <EditableField label="CTA label" value={heroCta} onChange={setHeroCta} />
              </>
            ) : null}
            {editingSection === "About" ? <EditableField label="About copy" value={about} onChange={setAbout} textarea /> : null}
            {editingSection === "Features" ? <EditableField label="Features, one per line" value={features} onChange={setFeatures} textarea /> : null}
            {editingSection === "Gallery" ? (
              <>
                <GalleryUploadPanel
                  gallery={gallery.split("\n").map((item) => item.trim()).filter(Boolean)}
                  uploading={uploading === "gallery"}
                  onUpload={uploadGalleryImages}
                  onRemove={removeGalleryImage}
                  onUseAsHero={useGalleryImageAsHero}
                />
                <EditableField label="Gallery image URLs, one per line" value={gallery} onChange={setGallery} textarea rows={8} />
              </>
            ) : null}
            {editingSection === "Rooms / Services" ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-[#52615a]">Add rooms, stay packages, activities, or MSME services as structured cards.</p>
                  <button type="button" onClick={addService} className="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
                    Add item
                  </button>
                </div>
                <div className="grid gap-4">
                  {services.map((service, index) => (
                    <ServiceEditor
                      key={service.id}
                      service={service}
                      onChange={(patch) => updateService(index, patch)}
                      onRemove={() => removeService(index)}
                    />
                  ))}
                  {services.length === 0 ? <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm text-[#6f7b74]">No rooms or services yet.</p> : null}
                </div>
              </>
            ) : null}
            {editingSection === "Experiences" ? <EditableField label="Experiences, one per line" value={experiences} onChange={setExperiences} textarea /> : null}
            {editingSection === "Booking CTA" ? <EditableField label="WhatsApp booking message template" value={bookingMessageTemplate} onChange={setBookingMessageTemplate} textarea rows={8} /> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => void saveSection()} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
                Save changes
              </button>
            </div>
            {uploadStatus ? <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#52615a]">{uploadStatus}</p> : null}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function serviceFromApi(service: ResortService): ResortServiceData {
  return {
    id: service.id,
    kind: service.kind,
    title: service.title,
    description: service.description ?? "",
    priceLabel: service.price_label ?? "",
    capacity: service.capacity?.toString() ?? "",
    imageUrl: service.image_url ?? "",
    sortOrder: service.sort_order,
    isActive: service.is_active,
  };
}

function ServiceEditor({
  service,
  onChange,
  onRemove,
}: {
  service: ResortServiceData;
  onChange: (patch: Partial<ResortServiceData>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
      <div className="flex items-start justify-between gap-3">
        <select
          value={service.kind}
          onChange={(event) => onChange({ kind: event.target.value as ResortServiceData["kind"] })}
          className="min-h-10 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]"
        >
          <option value="room">Room</option>
          <option value="service">Service</option>
          <option value="package">Package</option>
        </select>
        <button type="button" onClick={onRemove} className="text-sm font-semibold text-[#9d3323]">
          Remove
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <EditableField label="Title" value={service.title} onChange={(value) => onChange({ title: value })} />
        <EditableField label="Price label" value={service.priceLabel} onChange={(value) => onChange({ priceLabel: value })} />
        <EditableField label="Capacity" value={service.capacity} onChange={(value) => onChange({ capacity: value })} />
        <EditableField label="Image URL" value={service.imageUrl} onChange={(value) => onChange({ imageUrl: value })} />
      </div>
      <EditableField label="Description" value={service.description} onChange={(value) => onChange({ description: value })} textarea />
      <label className="flex items-center gap-2 text-sm font-semibold text-[#18352f]">
        <input type="checkbox" checked={service.isActive} onChange={(event) => onChange({ isActive: event.target.checked })} />
        Active
      </label>
    </div>
  );
}

function HeroImagePanel({
  imageUrl,
  uploading,
  onUpload,
}: {
  imageUrl: string;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-[#18352f]">Hero image</h3>
        <ImageUploadButton label={uploading ? "Uploading..." : "Upload hero image"} disabled={uploading} multiple={false} onUpload={(files) => {
          const file = files[0];
          if (file) {
            void onUpload(file);
          }
        }} />
      </div>
      {imageUrl ? (
        <div className="aspect-[16/9] rounded-2xl bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${imageUrl})` }} />
      ) : (
        <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-[#d8cebb] bg-white text-sm text-[#6f7b74]">
          No hero image selected
        </div>
      )}
    </section>
  );
}

function GalleryUploadPanel({
  gallery,
  uploading,
  onUpload,
  onRemove,
  onUseAsHero,
}: {
  gallery: string[];
  uploading: boolean;
  onUpload: (files: FileList) => Promise<void>;
  onRemove: (imageUrl: string) => Promise<void>;
  onUseAsHero: (imageUrl: string) => Promise<void>;
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-[#18352f]">Gallery images</h3>
        <ImageUploadButton label={uploading ? "Uploading..." : "Upload gallery"} disabled={uploading} multiple onUpload={onUpload} />
      </div>
      {gallery.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((imageUrl) => (
            <div key={imageUrl} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#eadfce]">
              <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
              <div className="grid gap-2 p-3">
                <p className="truncate text-xs text-[#6f7b74]">{imageUrl}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void onUseAsHero(imageUrl)} className="rounded-full bg-[#e6f0e7] px-3 py-1 text-xs font-semibold text-[#1f5a45]">
                    Use as hero
                  </button>
                  <button type="button" onClick={() => void onRemove(imageUrl)} className="rounded-full bg-[#fff7f5] px-3 py-1 text-xs font-semibold text-[#9d3323]">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-[#d8cebb] bg-white text-sm text-[#6f7b74]">
          No gallery images yet
        </div>
      )}
    </section>
  );
}

function ImageUploadButton({
  label,
  disabled,
  multiple,
  onUpload,
}: {
  label: string;
  disabled: boolean;
  multiple: boolean;
  onUpload: (files: FileList) => void;
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
      {label}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={disabled}
        multiple={multiple}
        onChange={(event) => {
          const files = event.target.files;
          event.currentTarget.value = "";
          if (files && files.length > 0) {
            onUpload(files);
          }
        }}
        className="sr-only"
      />
    </label>
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
