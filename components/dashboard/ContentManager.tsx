import { useEffect, useState } from "react";
import { FeatureSelector } from "@/components/dashboard/FeatureSelector";
import { contentSections } from "@/components/dashboard/mockData";
import { Badge, Panel } from "@/components/dashboard/ui";
import type { ContentSection, ResortConsoleData, ResortServiceData } from "@/types/dashboard";
import type { ResortService } from "@/types/resort";

type EditableSection = "Hero" | "About" | "Features" | "Gallery" | "Rooms / Services" | "Experiences" | "Booking CTA" | "Footer";

type GeneratedServiceResponse = {
  kind: ResortServiceData["kind"];
  title: string;
  description: string | null;
  price_label: string | null;
  capacity: number | null;
  image_url: string | null;
  highlight: string | null;
  duration: string | null;
  included: string[];
  cta_label: string | null;
};

function isEditableSection(title: ContentSection["title"]): title is EditableSection {
  return ["Hero", "About", "Features", "Gallery", "Rooms / Services", "Experiences", "Booking CTA", "Footer"].includes(title);
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
  const [heroImageUrl, setHeroImageUrl] = useState(site.heroImageUrl);
  const [heroCta, setHeroCta] = useState(site.heroCta);
  const [footerName, setFooterName] = useState(site.name);
  const [footerLocation, setFooterLocation] = useState(site.location);
  const [about, setAbout] = useState(site.about);
  const [features, setFeatures] = useState<string[]>(site.features);
  const [services, setServices] = useState<ResortServiceData[]>(site.services);
  const [gallery, setGallery] = useState(site.gallery.join("\n"));
  const [experiences, setExperiences] = useState(site.experiences.join("\n"));
  const [bookingMessageTemplate, setBookingMessageTemplate] = useState(site.bookingMessageTemplate);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [uploading, setUploading] = useState<"hero" | "gallery" | `service-${number}` | null>(null);
  const [generatingServices, setGeneratingServices] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    setHeroTitle(site.heroTitle);
    setHeroSubtitle(site.heroSubtitle);
    setHeroImageUrl(site.heroImageUrl);
    setHeroCta(site.heroCta);
    setFooterName(site.name);
    setFooterLocation(site.location);
    setAbout(site.about);
    setFeatures(site.features);
    setServices(site.services);
    setSelectedServiceIndex(0);
    setGallery(site.gallery.join("\n"));
    setExperiences(site.experiences.join("\n"));
    setBookingMessageTemplate(site.bookingMessageTemplate);
  }, [site.about, site.bookingMessageTemplate, site.experiences, site.features, site.gallery, site.heroCta, site.heroImageUrl, site.heroSubtitle, site.heroTitle, site.id, site.location, site.name, site.services]);

  useEffect(() => {
    setEditingSection(null);
  }, [site.id]);

  function startEditing(section: EditableSection) {
    setEditingSection(section);
    setHeroTitle(site.heroTitle);
    setHeroSubtitle(site.heroSubtitle);
    setHeroImageUrl(site.heroImageUrl);
    setHeroCta(site.heroCta);
    setFooterName(site.name);
    setFooterLocation(site.location);
    setAbout(site.about);
    setFeatures(site.features);
    setServices(site.services);
    setSelectedServiceIndex(0);
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
      setHeroImageUrl(publicUrl);
      await onSiteUpdate({ ...site, heroTitle, heroSubtitle, heroImageUrl: publicUrl, heroCta });
      setUploadStatus("Hero image uploaded and saved.");
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Hero image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function uploadGalleryImages(files: File[]) {
    setUploading("gallery");
    setUploadStatus(`Uploading ${files.length} gallery image${files.length > 1 ? "s" : ""}...`);
    try {
      const uploadedUrls = await Promise.all(files.map((file) => uploadImage(file, "gallery")));
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

  async function moveGalleryImage(index: number, direction: -1 | 1) {
    const currentGallery = gallery.split("\n").map((item) => item.trim()).filter(Boolean);
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= currentGallery.length) {
      return;
    }

    const nextGallery = [...currentGallery];
    [nextGallery[index], nextGallery[nextIndex]] = [nextGallery[nextIndex], nextGallery[index]];
    setGallery(nextGallery.join("\n"));
    await onSiteUpdate({ ...site, gallery: nextGallery });
  }

  async function useGalleryImageAsHero(imageUrl: string) {
    setHeroImageUrl(imageUrl);
    await onSiteUpdate({ ...site, heroImageUrl: imageUrl });
    setUploadStatus("Hero image updated from gallery.");
  }

  async function saveSection() {
    const nextFeatures = features.map((item) => item.trim()).filter(Boolean);

    if (editingSection === "Rooms / Services") {
      const savedServices = await saveServices();
      await onSiteUpdate({ ...site, services: savedServices });
      setEditingSection(null);
      return;
    }

    if (editingSection === "Footer") {
      await onSiteUpdate({ ...site, name: footerName, location: footerLocation });
      setEditingSection(null);
      return;
    }

    await onSiteUpdate({
      ...site,
      heroTitle,
      heroSubtitle,
      heroImageUrl,
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
          highlight: service.highlight,
          duration: service.duration,
          included: service.included,
          cta_label: service.ctaLabel,
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

  async function generateSampleServices() {
    if (!accessToken) {
      setUploadStatus("Sign in before generating rooms or services.");
      return;
    }

    setGeneratingServices(true);
    setUploadStatus("Generating sample rooms and services...");

    try {
      const response = await fetch(`/api/operator/resorts/${site.id}/services/generate`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not generate sample services.");
      }

      const generatedServices = ((data.services ?? []) as GeneratedServiceResponse[]).map((service, index) => ({
        id: `draft-ai-${Date.now()}-${index}`,
        kind: service.kind,
        title: service.title,
        description: service.description ?? "",
        priceLabel: service.price_label ?? "",
        capacity: service.capacity?.toString() ?? "",
        imageUrl: service.image_url ?? "",
        highlight: service.highlight ?? "",
        duration: service.duration ?? "",
        included: service.included ?? [],
        ctaLabel: service.cta_label ?? "",
        sortOrder: services.length + index,
        isActive: true,
      }));

      setServices((currentServices) => [...currentServices, ...generatedServices]);
      setSelectedServiceIndex(services.length);
      setUploadStatus(`${generatedServices.length} sample item${generatedServices.length === 1 ? "" : "s"} generated from ${data.source === "ai" ? "AI" : "fallback"}. Review and save changes to publish.`);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Could not generate sample services.");
    } finally {
      setGeneratingServices(false);
    }
  }

  function updateService(index: number, patch: Partial<ResortServiceData>) {
    setServices((currentServices) => currentServices.map((service, serviceIndex) => (serviceIndex === index ? { ...service, ...patch } : service)));
  }

  function addService(kind: ResortServiceData["kind"]) {
    setServices((currentServices) => {
      const nextService = {
        id: `draft-${Date.now()}`,
        kind,
        title: "",
        description: "",
        priceLabel: "",
        capacity: "",
        imageUrl: "",
        highlight: "",
        duration: "",
        included: [],
        ctaLabel: "",
        sortOrder: currentServices.length,
        isActive: true,
      };

      setSelectedServiceIndex(currentServices.length);
      return [...currentServices, nextService];
    });
  }

  function removeService(index: number) {
    setServices((currentServices) => {
      const nextServices = currentServices.filter((_, serviceIndex) => serviceIndex !== index);
      setSelectedServiceIndex(Math.max(0, Math.min(index, nextServices.length - 1)));
      return nextServices;
    });
  }

  function moveService(index: number, direction: -1 | 1) {
    setServices((currentServices) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= currentServices.length) {
        return currentServices;
      }

      const nextServices = [...currentServices];
      [nextServices[index], nextServices[nextIndex]] = [nextServices[nextIndex], nextServices[index]];
      setSelectedServiceIndex(nextIndex);
      return nextServices.map((service, serviceIndex) => ({ ...service, sortOrder: serviceIndex }));
    });
  }

  async function uploadServiceImage(index: number, file: File) {
    setUploading(`service-${index}`);
    setUploadStatus("Uploading service image...");
    try {
      const publicUrl = await uploadImage(file, "gallery");
      updateService(index, { imageUrl: publicUrl });
      setUploadStatus("Service image uploaded. Save changes to publish it.");
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Service image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Content</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Site sections</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Manage fixed hospitality sections with simple forms. No drag-and-drop page builder required.</p>
      </Panel>

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
                <HeroImagePanel imageUrl={heroImageUrl} uploading={uploading === "hero"} onUpload={uploadHeroImage} />
                <EditableField label="Hero title" value={heroTitle} onChange={setHeroTitle} />
                <EditableField label="Hero subtitle" value={heroSubtitle} onChange={setHeroSubtitle} textarea />
                <EditableField label="CTA label" value={heroCta} onChange={setHeroCta} />
              </>
            ) : null}
            {editingSection === "About" ? <EditableField label="About copy" value={about} onChange={setAbout} textarea /> : null}
            {editingSection === "Features" ? <FeatureSelector features={features} onChange={setFeatures} /> : null}
            {editingSection === "Gallery" ? (
              <>
                <GalleryUploadPanel
                  gallery={gallery.split("\n").map((item) => item.trim()).filter(Boolean)}
                  uploading={uploading === "gallery"}
                  onUpload={uploadGalleryImages}
                  onRemove={removeGalleryImage}
                  onMove={moveGalleryImage}
                  onUseAsHero={useGalleryImageAsHero}
                />
              </>
            ) : null}
            {editingSection === "Rooms / Services" ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-[#52615a]">Add rooms, stay packages, activities, or MSME services as structured cards.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void generateSampleServices()} disabled={generatingServices} className="min-h-10 rounded-full bg-[#18352f] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                      {generatingServices ? "Generating..." : "Generate sample items"}
                    </button>
                    <button type="button" onClick={() => addService("room")} className="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
                      Add Room
                    </button>
                    <button type="button" onClick={() => addService("package")} className="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
                      Add Package
                    </button>
                    <button type="button" onClick={() => addService("service")} className="min-h-10 rounded-full bg-white px-4 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
                      Add Service
                    </button>
                  </div>
                </div>
                <ServiceManager
                  services={services}
                  selectedIndex={selectedServiceIndex}
                  uploading={uploading}
                  onSelect={setSelectedServiceIndex}
                  onChange={updateService}
                  onRemove={removeService}
                  onMove={moveService}
                  onUploadImage={uploadServiceImage}
                />
              </>
            ) : null}
            {editingSection === "Experiences" ? <EditableField label="Experiences, one per line" value={experiences} onChange={setExperiences} textarea /> : null}
            {editingSection === "Booking CTA" ? <EditableField label="WhatsApp booking message template" value={bookingMessageTemplate} onChange={setBookingMessageTemplate} textarea rows={8} /> : null}
            {editingSection === "Footer" ? (
              <>
                <EditableField label="Business name" value={footerName} onChange={setFooterName} />
                <EditableField label="Footer location" value={footerLocation} onChange={setFooterLocation} />
              </>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => void saveSection()} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white">
                Save changes
              </button>
            </div>
            {uploadStatus ? <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#52615a]">{uploadStatus}</p> : null}
          </div>
        </Panel>
      ) : null}

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
              <button
                type="button"
                onClick={() => {
                  if (isEditableSection(section.title)) {
                    startEditing(section.title);
                  }
                }}
                className={`min-h-11 rounded-full px-5 text-sm font-semibold ring-1 ${
                  editingSection === section.title
                    ? "bg-[#18352f] text-white ring-[#18352f]"
                    : "bg-white text-[#18352f] ring-[#d8cebb]"
                }`}
              >
                {editingSection === section.title ? "Editing" : "Edit"}
              </button>
            </div>
            {section.title === "Hero" ? (
              <div
                className="mt-5 overflow-hidden rounded-2xl bg-[#18352f] text-white"
                style={site.heroImageUrl ? { backgroundImage: `linear-gradient(rgba(24, 53, 47, 0.72), rgba(24, 53, 47, 0.72)), url(${site.heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              >
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Hero preview</p>
                  <h3 className="mt-3 text-2xl font-semibold">{site.heroTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{site.heroSubtitle}</p>
                  <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#18352f]">{site.heroCta}</span>
                </div>
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
                {site.services.length > 0 ? (
                  site.services.slice(0, 4).map((service) => (
                    <div key={service.id} className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 rounded-2xl bg-[#fbfaf7] p-3">
                      <div className="aspect-square rounded-xl bg-[#eadfce] bg-cover bg-center" style={service.imageUrl ? { backgroundImage: `url(${service.imageUrl})` } : undefined} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#e6f0e7] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#1f5a45]">{service.kind}</span>
                          {!service.isActive ? <span className="rounded-full bg-[#fff7f5] px-2 py-0.5 text-[11px] font-semibold text-[#9d3323]">Inactive</span> : null}
                        </div>
                        <p className="mt-2 truncate text-sm font-semibold text-[#18352f]">{service.title || "Untitled item"}</p>
                        <p className="mt-1 truncate text-xs text-[#6f7b74]">{service.priceLabel || service.duration || service.highlight || "No pricing or duration yet"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#fbfaf7] p-4">
                    <p className="text-sm font-semibold text-[#18352f]">No rooms or services yet</p>
                    <p className="mt-1 text-xs leading-5 text-[#6f7b74]">Add rooms, packages, or services to show bookable offers on your site.</p>
                  </div>
                )}
              </div>
            ) : null}
            {section.title === "Booking CTA" ? (
              <div className="mt-5 rounded-2xl bg-[#18352f] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">WhatsApp message</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/78">{site.bookingMessageTemplate}</p>
              </div>
            ) : null}
            {section.title === "Footer" ? (
              <div className="mt-5 rounded-2xl bg-[#11241f] p-5 text-white">
                <p className="text-sm font-semibold">{site.name}</p>
                <p className="mt-1 text-sm text-white/70">{site.location}</p>
              </div>
            ) : null}
          </Panel>
        ))}
      </div>
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
    highlight: service.highlight ?? "",
    duration: service.duration ?? "",
    included: service.included ?? [],
    ctaLabel: service.cta_label ?? "",
    sortOrder: service.sort_order,
    isActive: service.is_active,
  };
}

function ServiceManager({
  services,
  selectedIndex,
  uploading,
  onSelect,
  onChange,
  onRemove,
  onMove,
  onUploadImage,
}: {
  services: ResortServiceData[];
  selectedIndex: number;
  uploading: "hero" | "gallery" | `service-${number}` | null;
  onSelect: (index: number) => void;
  onChange: (index: number, patch: Partial<ResortServiceData>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onUploadImage: (index: number, file: File) => void;
}) {
  const selectedService = services[selectedIndex] ?? null;

  if (services.length === 0) {
    return <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm text-[#6f7b74]">No rooms or services yet.</p>;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.45fr_0.55fr]">
      <div className="grid content-start gap-3 rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <h3 className="text-sm font-semibold text-[#18352f]">Items</h3>
          <span className="text-xs font-semibold text-[#72815e]">{services.length} total</span>
        </div>
        <div className="grid gap-2">
          {services.map((service, index) => (
            <ServiceListItem
              key={service.id}
              service={service}
              index={index}
              total={services.length}
              selected={index === selectedIndex}
              onSelect={() => onSelect(index)}
              onMove={(direction) => onMove(index, direction)}
              onRemove={() => onRemove(index)}
            />
          ))}
        </div>
      </div>

      {selectedService ? (
        <ServiceDetailEditor
          service={selectedService}
          index={selectedIndex}
          uploading={uploading === `service-${selectedIndex}`}
          onChange={(patch) => onChange(selectedIndex, patch)}
          onUploadImage={(file) => onUploadImage(selectedIndex, file)}
        />
      ) : (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-[#d8cebb] bg-[#fbfaf7] text-sm text-[#6f7b74]">
          Select an item to edit.
        </div>
      )}
    </div>
  );
}

function ServiceListItem({
  service,
  index,
  total,
  selected,
  onSelect,
  onMove,
  onRemove,
}: {
  service: ResortServiceData;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <article className={`grid grid-cols-[88px_minmax(0,1fr)] gap-3 rounded-2xl border p-2 transition ${selected ? "border-[#18352f] bg-white shadow-sm" : "border-[#eadfce] bg-white/75"}`}>
      <button type="button" onClick={onSelect} className="aspect-square overflow-hidden rounded-xl bg-[#eadfce] text-left">
        {service.imageUrl ? <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${service.imageUrl})` }} /> : null}
      </button>
      <div className="min-w-0">
        <button type="button" onClick={onSelect} className="block w-full text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e6f0e7] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#1f5a45]">{service.kind}</span>
            {!service.isActive ? <span className="rounded-full bg-[#fff7f5] px-2 py-0.5 text-[11px] font-semibold text-[#9d3323]">Inactive</span> : null}
          </div>
          <h4 className="mt-2 truncate text-sm font-semibold text-[#18352f]">{service.title || "Untitled item"}</h4>
          <p className="mt-1 truncate text-xs text-[#6f7b74]">{service.priceLabel || service.duration || service.highlight || "No details yet"}</p>
        </button>
        <div className="mt-3 flex flex-wrap gap-1">
          <button type="button" onClick={onSelect} className="rounded-full bg-[#18352f] px-2 py-1 text-[11px] font-semibold text-white">
            Edit
          </button>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded-full bg-[#fbfaf7] px-2 py-1 text-[11px] font-semibold text-[#18352f] ring-1 ring-[#eadfce] disabled:cursor-not-allowed disabled:opacity-40">
            Up
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="rounded-full bg-[#fbfaf7] px-2 py-1 text-[11px] font-semibold text-[#18352f] ring-1 ring-[#eadfce] disabled:cursor-not-allowed disabled:opacity-40">
            Down
          </button>
          <button type="button" onClick={onRemove} className="rounded-full bg-[#fff7f5] px-2 py-1 text-[11px] font-semibold text-[#9d3323]">
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

function ServiceDetailEditor({
  service,
  index,
  uploading,
  onChange,
  onUploadImage,
}: {
  service: ResortServiceData;
  index: number;
  uploading: boolean;
  onChange: (patch: Partial<ResortServiceData>) => void;
  onUploadImage: (file: File) => void;
}) {
  return (
    <div className="grid content-start gap-4 rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#72815e]">Editing item {index + 1}</p>
          <h3 className="mt-1 text-xl font-semibold text-[#18352f]">{service.title || "Untitled item"}</h3>
        </div>
        <select
          value={service.kind}
          onChange={(event) => onChange({ kind: event.target.value as ResortServiceData["kind"] })}
          className="min-h-10 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]"
        >
          <option value="room">Room</option>
          <option value="package">Package</option>
          <option value="service">Service</option>
        </select>
      </div>

      <ServiceImagePanel imageUrl={service.imageUrl} uploading={uploading} onUpload={onUploadImage} onClear={() => onChange({ imageUrl: "" })} />
      <div className="grid gap-4 md:grid-cols-2">
        <EditableField label="Title" value={service.title} onChange={(value) => onChange({ title: value })} />
        <EditableField label="Price label" value={service.priceLabel} onChange={(value) => onChange({ priceLabel: value })} />
        <EditableField label="Capacity" value={service.capacity} onChange={(value) => onChange({ capacity: value })} />
        <EditableField label="Duration" value={service.duration} onChange={(value) => onChange({ duration: value })} />
        <EditableField label="Highlight badge" value={service.highlight} onChange={(value) => onChange({ highlight: value })} />
        <EditableField label="CTA label" value={service.ctaLabel} onChange={(value) => onChange({ ctaLabel: value })} />
      </div>
      <EditableField label="Description" value={service.description} onChange={(value) => onChange({ description: value })} textarea />
      <EditableField label="Included items, one per line" value={service.included.join("\n")} onChange={(value) => onChange({ included: value.split("\n").map((item) => item.trim()).filter(Boolean) })} textarea rows={4} />
      <label className="flex items-center gap-2 text-sm font-semibold text-[#18352f]">
        <input type="checkbox" checked={service.isActive} onChange={(event) => onChange({ isActive: event.target.checked })} />
        Active
      </label>
    </div>
  );
}

function ServiceImagePanel({
  imageUrl,
  uploading,
  onUpload,
  onClear,
}: {
  imageUrl: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-[#eadfce] bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-semibold text-[#18352f]">Card image</h4>
        <div className="flex flex-wrap gap-2">
          {imageUrl ? (
            <button type="button" onClick={onClear} className="rounded-full bg-[#fff7f5] px-3 py-1 text-xs font-semibold text-[#9d3323]">
              Clear
            </button>
          ) : null}
          <ImageUploadButton label={uploading ? "Uploading..." : "Upload image"} disabled={uploading} multiple={false} onUpload={(files) => {
            const file = files[0];
            if (file) {
              onUpload(file);
            }
          }} />
        </div>
      </div>
      {imageUrl ? (
        <div className="aspect-[4/3] rounded-2xl bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${imageUrl})` }} />
      ) : (
        <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-[#d8cebb] bg-[#fbfaf7] text-sm text-[#6f7b74]">
          No image selected
        </div>
      )}
    </section>
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
  onMove,
  onUseAsHero,
}: {
  gallery: string[];
  uploading: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onRemove: (imageUrl: string) => Promise<void>;
  onMove: (index: number, direction: -1 | 1) => Promise<void>;
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
          {gallery.map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#eadfce]">
              <div className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
              <div className="grid gap-2 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#72815e]">Image {index + 1}</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void onMove(index, -1)}
                      disabled={index === 0}
                      className="rounded-full bg-[#fbfaf7] px-2 py-1 text-xs font-semibold text-[#18352f] ring-1 ring-[#eadfce] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => void onMove(index, 1)}
                      disabled={index === gallery.length - 1}
                      className="rounded-full bg-[#fbfaf7] px-2 py-1 text-xs font-semibold text-[#18352f] ring-1 ring-[#eadfce] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Down
                    </button>
                  </div>
                </div>
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
  onUpload: (files: File[]) => void;
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
          const selectedFiles = files ? Array.from(files) : [];
          event.currentTarget.value = "";
          if (selectedFiles.length > 0) {
            onUpload(selectedFiles);
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
