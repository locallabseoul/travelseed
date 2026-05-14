"use client";

import { useEffect, useState } from "react";
import { Badge, Panel } from "@/components/dashboard/ui";
import type { ResortConsoleData, ResortServiceData } from "@/types/dashboard";
import type { ResortService } from "@/types/resort";

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

const offerSections: Array<{
  kind: ResortServiceData["kind"];
  title: string;
  description: string;
  addLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}> = [
  {
    kind: "room",
    title: "Rooms",
    description: "Stay units guests can book, such as villas, suites, dorms, or private rooms.",
    addLabel: "Add Room",
    emptyTitle: "No rooms yet",
    emptyDescription: "Add room types or villa options when this site offers accommodation.",
  },
  {
    kind: "package",
    title: "Packages",
    description: "Bundled offers such as stay packages, surf camp programs, retreats, or promos.",
    addLabel: "Add Package",
    emptyTitle: "No packages yet",
    emptyDescription: "Create packages when you want to bundle stay, activities, transfers, or meals.",
  },
  {
    kind: "service",
    title: "Services",
    description: "Add-ons, experiences, activities, or MSME services that guests can request.",
    addLabel: "Add Service",
    emptyTitle: "No services yet",
    emptyDescription: "Add services for airport pickup, lessons, rentals, tours, or local business offers.",
  },
];

export function OffersManager({
  site,
  accessToken,
  onSiteUpdate,
}: {
  site: ResortConsoleData;
  accessToken: string | null;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
}) {
  const [services, setServices] = useState<ResortServiceData[]>(site.services);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [uploading, setUploading] = useState<`service-${number}` | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setServices(site.services);
    setSelectedServiceIndex(0);
    setStatus("");
  }, [site.id, site.services]);

  async function uploadImage(file: File) {
    if (!accessToken) {
      throw new Error("Sign in before uploading images.");
    }

    const formData = new FormData();
    formData.set("file", file, file.name);
    formData.set("folder", "gallery");
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

  async function saveServices() {
    if (!accessToken) {
      setStatus("Sign in before saving rooms or services.");
      return;
    }

    setSaving(true);
    setStatus("Saving offers...");
    try {
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

      const savedServices = ((data.services ?? []) as ResortService[]).map(serviceFromApi);
      setServices(savedServices);
      await onSiteUpdate({ ...site, services: savedServices });
      setStatus("Offers saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save rooms or services.");
    } finally {
      setSaving(false);
    }
  }

  async function generateSampleServices() {
    if (!accessToken) {
      setStatus("Sign in before generating rooms or services.");
      return;
    }

    setGenerating(true);
    setStatus("Generating sample rooms and services...");
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
      setStatus(`${generatedServices.length} sample item${generatedServices.length === 1 ? "" : "s"} generated from ${data.source === "ai" ? "AI" : "fallback"}. Review and save changes to publish.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not generate sample services.");
    } finally {
      setGenerating(false);
    }
  }

  function updateService(index: number, patch: Partial<ResortServiceData>) {
    setServices((currentServices) => currentServices.map((service, serviceIndex) => (serviceIndex === index ? { ...service, ...patch } : service)));
  }

  function addService(kind: ResortServiceData["kind"]) {
    setServices((currentServices) => {
      const nextService: ResortServiceData = {
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
      const service = currentServices[index];
      if (!service) {
        return currentServices;
      }

      const sectionIndexes = currentServices.map((currentService, serviceIndex) => ({ kind: currentService.kind, serviceIndex })).filter((item) => item.kind === service.kind).map((item) => item.serviceIndex);
      const currentSectionIndex = sectionIndexes.indexOf(index);
      const nextSectionIndex = currentSectionIndex + direction;
      const nextIndex = sectionIndexes[nextSectionIndex];

      if (nextIndex === undefined) {
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
    setStatus("Uploading service image...");
    try {
      const publicUrl = await uploadImage(file);
      updateService(index, { imageUrl: publicUrl });
      setStatus("Service image uploaded. Save changes to publish it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Service image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  const activeCount = services.filter((service) => service.isActive).length;

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Offers</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Rooms, packages & services</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">
              Manage the bookable offers that appear on your direct booking site. Keep content structured so guests can scan and inquire quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">{activeCount} active</Badge>
            <Badge tone="gray">{services.length} total</Badge>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#18352f]">Offer inventory</h2>
            <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Add rooms for stays, packages for bundled offers, and services for add-ons or local businesses.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void generateSampleServices()} disabled={generating} className="min-h-10 rounded-full bg-[#18352f] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {generating ? "Generating..." : "Generate sample items"}
            </button>
          </div>
        </div>

        <div className="mt-5">
          <ServiceManager
            services={services}
            selectedIndex={selectedServiceIndex}
            uploading={uploading}
            onSelect={setSelectedServiceIndex}
            onChange={updateService}
            onRemove={removeService}
            onMove={moveService}
            onAdd={addService}
            onUploadImage={uploadServiceImage}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={() => void saveServices()} disabled={saving} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving..." : "Save offers"}
          </button>
          {status ? <p className="rounded-2xl bg-[#fbfaf7] px-4 py-3 text-sm leading-6 text-[#52615a]">{status}</p> : null}
        </div>
      </Panel>
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
  onAdd,
  onUploadImage,
}: {
  services: ResortServiceData[];
  selectedIndex: number;
  uploading: `service-${number}` | null;
  onSelect: (index: number) => void;
  onChange: (index: number, patch: Partial<ResortServiceData>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onAdd: (kind: ResortServiceData["kind"]) => void;
  onUploadImage: (index: number, file: File) => void;
}) {
  const selectedService = services[selectedIndex] ?? null;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.45fr_0.55fr]">
      <div className="grid content-start gap-4">
        {offerSections.map((section) => {
          const sectionServices = services.map((service, index) => ({ service, index })).filter((item) => item.service.kind === section.kind);

          return (
            <OfferKindSection
              key={section.kind}
              section={section}
              services={sectionServices}
              selectedIndex={selectedIndex}
              onAdd={() => onAdd(section.kind)}
              onSelect={onSelect}
              onMove={onMove}
              onRemove={onRemove}
            />
          );
        })}
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

function OfferKindSection({
  section,
  services,
  selectedIndex,
  onAdd,
  onSelect,
  onMove,
  onRemove,
}: {
  section: (typeof offerSections)[number];
  services: Array<{ service: ResortServiceData; index: number }>;
  selectedIndex: number;
  onAdd: () => void;
  onSelect: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#18352f]">{section.title}</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#72815e] ring-1 ring-[#eadfce]">{services.length}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#6f7b74]">{section.description}</p>
        </div>
        <button type="button" onClick={onAdd} className="min-h-9 rounded-full bg-white px-3 text-xs font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
          {section.addLabel}
        </button>
      </div>

      {services.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
          {services.map(({ service, index }, sectionIndex) => (
            <ServiceListItem
              key={service.id}
              service={service}
              index={index}
              sectionIndex={sectionIndex}
              sectionTotal={services.length}
              selected={index === selectedIndex}
              onSelect={() => onSelect(index)}
              onMove={(direction) => onMove(index, direction)}
              onRemove={() => onRemove(index)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d8cebb] bg-white p-4">
          <p className="text-sm font-semibold text-[#18352f]">{section.emptyTitle}</p>
          <p className="mt-1 text-xs leading-5 text-[#6f7b74]">{section.emptyDescription}</p>
        </div>
      )}
    </section>
  );
}

function ServiceListItem({
  service,
  sectionIndex,
  sectionTotal,
  selected,
  onSelect,
  onMove,
  onRemove,
}: {
  service: ResortServiceData;
  index: number;
  sectionIndex: number;
  sectionTotal: number;
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
          <button type="button" onClick={() => onMove(-1)} disabled={sectionIndex === 0} className="rounded-full bg-[#fbfaf7] px-2 py-1 text-[11px] font-semibold text-[#18352f] ring-1 ring-[#eadfce] disabled:cursor-not-allowed disabled:opacity-40">
            Up
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={sectionIndex === sectionTotal - 1} className="rounded-full bg-[#fbfaf7] px-2 py-1 text-[11px] font-semibold text-[#18352f] ring-1 ring-[#eadfce] disabled:cursor-not-allowed disabled:opacity-40">
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
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#72815e]">Editing offer {index + 1}</p>
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
          <ImageUploadButton label={uploading ? "Uploading..." : "Upload image"} disabled={uploading} onUpload={(files) => {
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

function ImageUploadButton({
  label,
  disabled,
  onUpload,
}: {
  label: string;
  disabled: boolean;
  onUpload: (files: File[]) => void;
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
      {label}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={disabled}
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
