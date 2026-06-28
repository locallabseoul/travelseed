"use client";

import { useEffect, useState } from "react";
import { Badge, Panel } from "@/components/dashboard/ui";
import { businessCategoryFromType, offerSectionsForCategory } from "@/lib/business-categories";
import type { DashboardUnsavedChanges, ResortConsoleData, ResortOfferData } from "@/types/dashboard";
import type { ResortOffer } from "@/types/resort";

type GeneratedOfferResponse = {
  kind: ResortOfferData["kind"];
  title: string;
  description: string | null;
  price_label: string | null;
  capacity: number | null;
  image_url: string | null;
  highlight: string | null;
  duration: string | null;
  included: string[];
  cta_label: string | null;
  bed_type?: string | null;
  room_size?: string | null;
  view_type?: string | null;
  bathroom_info?: string | null;
  max_guests?: number | null;
  room_amenities?: string[];
};

type OfferSectionConfig = {
  kind: ResortOfferData["kind"];
  title: string;
  description: string;
  addLabel: string;
  emptyTitle: string;
  emptyDescription: string;
};

const bedTypeOptions = ["King bed", "Queen bed", "Twin beds", "Double bed", "Bunk beds", "Sofa bed", "Mixed beds"];
const viewTypeOptions = ["Ocean view", "Garden view", "Pool view", "Mountain view", "Rice field view", "Courtyard view", "No view / Interior"];
const bathroomOptions = ["Private bathroom", "Shared bathroom", "Ensuite bathroom", "Outdoor bathroom", "Bathtub", "Shower only"];
const durationOptions = ["Per night", "2 nights", "3 days / 2 nights", "Half day", "Full day"];
const highlightOptions = ["Best value", "Popular", "Limited offer", "Family friendly", "Private", "New"];
const priceLabelOptions = ["From IDR ...", "Per night", "Per person", "Per package", "Contact for price"];
const roomAmenityOptions = ["Air conditioning", "WiFi", "Hot water", "Private balcony", "Mini fridge", "Safe", "Desk", "Wardrobe", "Coffee/tea", "Smart TV"];
const defaultPromotionBadge = "WhatsApp offer";

function toggleListValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function canShowOnPromotions(offer: Pick<ResortOfferData, "kind">) {
  return offer.kind === "package" || offer.kind === "service";
}

function isShownOnPromotions(offer: Pick<ResortOfferData, "kind" | "highlight" | "isActive">) {
  return offer.isActive && canShowOnPromotions(offer) && Boolean(offer.highlight.trim());
}

function hasPromotionPlacement(offer: Pick<ResortOfferData, "kind" | "highlight">) {
  return canShowOnPromotions(offer) && Boolean(offer.highlight.trim());
}

export function OffersManager({
  site,
  accessToken,
  onSiteUpdate,
  onUnsavedChangesChange,
}: {
  site: ResortConsoleData;
  accessToken: string | null;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
}) {
  const [offers, setOffers] = useState<ResortOfferData[]>(site.services);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(0);
  const [uploading, setUploading] = useState<`offer-${number}` | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const category = businessCategoryFromType({ type: site.type, templateId: site.template });
  const offerSections = category.id === "accommodation" || offers.some((offer) => offer.kind === "room")
    ? offerSectionsForCategory(category).some((section) => section.kind === "room")
      ? offerSectionsForCategory(category)
      : [...offerSectionsForCategory(category), { kind: "room" as const, ...category.offerSections.room }]
    : offerSectionsForCategory(category);

  useEffect(() => {
    setOffers(site.services);
    setSelectedOfferIndex(0);
    setStatus("");
  }, [site.id, site.services]);

  useEffect(() => {
    const isDirty = JSON.stringify(offers) !== JSON.stringify(site.services);
    onUnsavedChangesChange?.({
      isDirty,
      title: "Discard offer changes?",
      description: "You have service, package, or room changes that have not been saved. Continue without saving them?",
    });

    return () => onUnsavedChangesChange?.({ isDirty: false, title: "", description: "" });
  }, [offers, onUnsavedChangesChange, site.services]);

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

  async function saveOffers() {
    if (!accessToken) {
      setStatus("Sign in before saving offers.");
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
          services: offers.map((offer, index) => ({
            kind: offer.kind,
            title: offer.title,
            description: offer.description,
            price_label: offer.priceLabel,
            capacity: offer.capacity ? Number(offer.capacity) : null,
            image_url: offer.imageUrl,
            highlight: offer.highlight,
            duration: offer.duration,
            included: offer.included,
            cta_label: offer.ctaLabel,
            bed_type: offer.bedType,
            room_size: offer.roomSize,
            view_type: offer.viewType,
            bathroom_info: offer.bathroomInfo,
            max_guests: offer.maxGuests ? Number(offer.maxGuests) : null,
            room_amenities: offer.roomAmenities,
            sort_order: index,
            is_active: offer.isActive,
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not save offers.");
      }

      const savedOffers = ((data.services ?? []) as ResortOffer[]).map(offerFromApi);
      setOffers(savedOffers);
      await onSiteUpdate({ ...site, services: savedOffers });
      setStatus("Offers saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save offers.");
    } finally {
      setSaving(false);
    }
  }

  async function generateSampleOffers() {
    if (!accessToken) {
      setStatus("Sign in before generating offers.");
      return;
    }

    setGenerating(true);
    setStatus("Generating sample offers...");
    try {
      const response = await fetch(`/api/operator/resorts/${site.id}/services/generate`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not generate sample offers.");
      }

      const generatedOffers = ((data.services ?? []) as GeneratedOfferResponse[]).map((offer, index) => ({
        id: `draft-ai-${Date.now()}-${index}`,
        kind: offer.kind,
        title: offer.title,
        description: offer.description ?? "",
        priceLabel: offer.price_label ?? "",
        capacity: offer.capacity?.toString() ?? "",
        imageUrl: offer.image_url ?? "",
        highlight: offer.highlight ?? "",
        duration: offer.duration ?? "",
        included: offer.included ?? [],
        ctaLabel: offer.cta_label ?? "",
        bedType: offer.bed_type ?? "",
        roomSize: offer.room_size ?? "",
        viewType: offer.view_type ?? "",
        bathroomInfo: offer.bathroom_info ?? "",
        maxGuests: offer.max_guests?.toString() ?? "",
        roomAmenities: offer.room_amenities ?? [],
        sortOrder: offers.length + index,
        isActive: true,
      }));

      setOffers((currentOffers) => [...currentOffers, ...generatedOffers]);
      setSelectedOfferIndex(offers.length);
      setStatus(`${generatedOffers.length} sample item${generatedOffers.length === 1 ? "" : "s"} generated from ${data.source === "ai" ? "AI" : "fallback"}. Review and save changes to publish.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not generate sample offers.");
    } finally {
      setGenerating(false);
    }
  }

  function updateOffer(index: number, patch: Partial<ResortOfferData>) {
    setOffers((currentOffers) => currentOffers.map((offer, offerIndex) => (offerIndex === index ? { ...offer, ...patch } : offer)));
  }

  function addOffer(kind: ResortOfferData["kind"]) {
    setOffers((currentOffers) => {
      const nextOffer: ResortOfferData = {
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
        bedType: "",
        roomSize: "",
        viewType: "",
        bathroomInfo: "",
        maxGuests: "",
        roomAmenities: [],
        sortOrder: currentOffers.length,
        isActive: true,
      };

      setSelectedOfferIndex(currentOffers.length);
      return [...currentOffers, nextOffer];
    });
  }

  function removeOffer(index: number) {
    setOffers((currentOffers) => {
      const nextOffers = currentOffers.filter((_, offerIndex) => offerIndex !== index);
      setSelectedOfferIndex(Math.max(0, Math.min(index, nextOffers.length - 1)));
      return nextOffers;
    });
  }

  function moveOffer(index: number, direction: -1 | 1) {
    setOffers((currentOffers) => {
      const offer = currentOffers[index];
      if (!offer) {
        return currentOffers;
      }

      const sectionIndexes = currentOffers.map((currentOffer, offerIndex) => ({ kind: currentOffer.kind, offerIndex })).filter((item) => item.kind === offer.kind).map((item) => item.offerIndex);
      const currentSectionIndex = sectionIndexes.indexOf(index);
      const nextSectionIndex = currentSectionIndex + direction;
      const nextIndex = sectionIndexes[nextSectionIndex];

      if (nextIndex === undefined) {
        return currentOffers;
      }

      const nextOffers = [...currentOffers];
      [nextOffers[index], nextOffers[nextIndex]] = [nextOffers[nextIndex], nextOffers[index]];
      setSelectedOfferIndex(nextIndex);
      return nextOffers.map((nextOffer, offerIndex) => ({ ...nextOffer, sortOrder: offerIndex }));
    });
  }

  async function uploadOfferImage(index: number, file: File) {
    setUploading(`offer-${index}`);
    setStatus("Uploading offer image...");
    try {
      const publicUrl = await uploadImage(file);
      updateOffer(index, { imageUrl: publicUrl });
      setStatus("Offer image uploaded. Save changes to publish it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Offer image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  const activeCount = offers.filter((offer) => offer.isActive).length;
  const promotionsCount = offers.filter(isShownOnPromotions).length;

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Offers</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Offer inventory</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage {category.offerSectionTitle.toLowerCase()} that appear on your WhatsApp-ready site. Keep content structured so customers can scan and inquire quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">{activeCount} active</Badge>
            <Badge tone="sand">{promotionsCount} promotions</Badge>
            <Badge tone="gray">{offers.length} total</Badge>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Offer inventory</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{category.offerSectionBody}. Use rooms only for accommodation businesses.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void generateSampleOffers()} disabled={generating} className="min-h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
              {generating ? "Generating..." : "Generate sample items"}
            </button>
          </div>
        </div>

        <div className="mt-5">
          <OfferManager
            offers={offers}
            selectedIndex={selectedOfferIndex}
            uploading={uploading}
            onSelect={setSelectedOfferIndex}
            onChange={updateOffer}
            onRemove={removeOffer}
            onMove={moveOffer}
            onAdd={addOffer}
            onUploadImage={uploadOfferImage}
            offerSections={offerSections}
            category={category}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={() => void saveOffers()} disabled={saving} className="min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving..." : "Save offers"}
          </button>
          {status ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{status}</p> : null}
        </div>
      </Panel>
    </div>
  );
}

function offerFromApi(offer: ResortOffer): ResortOfferData {
  return {
    id: offer.id,
    kind: offer.kind,
    title: offer.title,
    description: offer.description ?? "",
    priceLabel: offer.price_label ?? "",
    capacity: offer.capacity?.toString() ?? "",
    imageUrl: offer.image_url ?? "",
    highlight: offer.highlight ?? "",
    duration: offer.duration ?? "",
    included: offer.included ?? [],
    ctaLabel: offer.cta_label ?? "",
    bedType: offer.bed_type ?? "",
    roomSize: offer.room_size ?? "",
    viewType: offer.view_type ?? "",
    bathroomInfo: offer.bathroom_info ?? "",
    maxGuests: offer.max_guests?.toString() ?? "",
    roomAmenities: offer.room_amenities ?? [],
    sortOrder: offer.sort_order,
    isActive: offer.is_active,
  };
}

function OfferManager({
  offers,
  selectedIndex,
  uploading,
  onSelect,
  onChange,
  onRemove,
  onMove,
  onAdd,
  onUploadImage,
  offerSections,
  category,
}: {
  offers: ResortOfferData[];
  selectedIndex: number;
  uploading: `offer-${number}` | null;
  onSelect: (index: number) => void;
  onChange: (index: number, patch: Partial<ResortOfferData>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onAdd: (kind: ResortOfferData["kind"]) => void;
  onUploadImage: (index: number, file: File) => void;
  offerSections: OfferSectionConfig[];
  category: ReturnType<typeof businessCategoryFromType>;
}) {
  const selectedOffer = offers[selectedIndex] ?? null;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.45fr_0.55fr]">
      <div className="grid content-start gap-4">
        {offerSections.map((section) => {
          const sectionOffers = offers.map((offer, index) => ({ offer, index })).filter((item) => item.offer.kind === section.kind);

          return (
            <OfferKindSection
              key={section.kind}
              section={section}
              offers={sectionOffers}
              selectedIndex={selectedIndex}
              onAdd={() => onAdd(section.kind)}
              onSelect={onSelect}
              onMove={onMove}
              onRemove={onRemove}
            />
          );
        })}
      </div>

      {selectedOffer ? (
        <OfferDetailEditor
          offer={selectedOffer}
          index={selectedIndex}
          uploading={uploading === `offer-${selectedIndex}`}
          onChange={(patch) => onChange(selectedIndex, patch)}
          onUploadImage={(file) => onUploadImage(selectedIndex, file)}
          category={category}
        />
      ) : (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-600">
          Select an item to edit.
        </div>
      )}
    </div>
  );
}

function OfferKindSection({
  section,
  offers,
  selectedIndex,
  onAdd,
  onSelect,
  onMove,
  onRemove,
}: {
  section: OfferSectionConfig;
  offers: Array<{ offer: ResortOfferData; index: number }>;
  selectedIndex: number;
  onAdd: () => void;
  onSelect: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-950">{section.title}</h3>
            <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-slate-200">{offers.length}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-600">{section.description}</p>
        </div>
        <button type="button" onClick={onAdd} className="min-h-9 rounded-md bg-white px-3 text-xs font-semibold text-slate-950 ring-1 ring-slate-200">
          {section.addLabel}
        </button>
      </div>

      {offers.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
          {offers.map(({ offer, index }, sectionIndex) => (
            <OfferListItem
              key={offer.id}
              offer={offer}
              sectionIndex={sectionIndex}
              sectionTotal={offers.length}
              selected={index === selectedIndex}
              onSelect={() => onSelect(index)}
              onMove={(direction) => onMove(index, direction)}
              onRemove={() => onRemove(index)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-950">{section.emptyTitle}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{section.emptyDescription}</p>
        </div>
      )}
    </section>
  );
}

function OfferListItem({
  offer,
  sectionIndex,
  sectionTotal,
  selected,
  onSelect,
  onMove,
  onRemove,
}: {
  offer: ResortOfferData;
  sectionIndex: number;
  sectionTotal: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <article className={`grid grid-cols-[88px_minmax(0,1fr)] gap-3 rounded-lg border p-2 transition ${selected ? "border-slate-950 bg-white shadow-sm" : "border-slate-200 bg-white/75"}`}>
      <button type="button" onClick={onSelect} className="aspect-square overflow-hidden rounded-lg bg-slate-100 text-left">
        {offer.imageUrl ? <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${offer.imageUrl})` }} /> : null}
      </button>
      <div className="min-w-0">
        <button type="button" onClick={onSelect} className="block w-full text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-emerald-700">{offer.kind}</span>
            {!offer.isActive ? <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">Inactive</span> : null}
            {isShownOnPromotions(offer) ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Promotions page</span> : null}
          </div>
          <h4 className="mt-2 truncate text-sm font-semibold text-slate-950">{offer.title || "Untitled item"}</h4>
          <p className="mt-1 truncate text-xs text-slate-600">{offer.priceLabel || offer.duration || offer.highlight || "No details yet"}</p>
        </button>
        <div className="mt-3 flex flex-wrap gap-1">
          <button type="button" onClick={onSelect} className="rounded-md bg-slate-950 px-2 py-1 text-[11px] font-semibold text-white">
            Edit
          </button>
          <button type="button" onClick={() => onMove(-1)} disabled={sectionIndex === 0} className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-950 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
            Up
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={sectionIndex === sectionTotal - 1} className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-950 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
            Down
          </button>
          <button type="button" onClick={onRemove} className="rounded-md bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

function OfferDetailEditor({
  offer,
  index,
  uploading,
  onChange,
  onUploadImage,
  category,
}: {
  offer: ResortOfferData;
  index: number;
  uploading: boolean;
  onChange: (patch: Partial<ResortOfferData>) => void;
  onUploadImage: (file: File) => void;
  category: ReturnType<typeof businessCategoryFromType>;
}) {
  return (
    <div className="grid content-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Editing offer {index + 1}</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">{offer.title || "Untitled item"}</h3>
        </div>
        <select
          value={offer.kind}
          onChange={(event) => onChange({ kind: event.target.value as ResortOfferData["kind"] })}
          className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600"
        >
          <option value="service">Service</option>
          <option value="package">Package</option>
          <option value="room">Room</option>
        </select>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-4">
          <OfferImagePanel imageUrl={offer.imageUrl} uploading={uploading} onUpload={onUploadImage} onClear={() => onChange({ imageUrl: "" })} />
          {canShowOnPromotions(offer) ? (
            <PromotionPlacementPanel offer={offer} onChange={onChange} />
          ) : null}
          <PresetGroup
            label="Starter templates"
            options={category.starterPresets[offer.kind].map((preset) => preset.label)}
            selected={[]}
            onSelect={(label) => {
              const preset = category.starterPresets[offer.kind].find((item) => item.label === label);
              if (preset) {
                onChange(preset.patch);
              }
            }}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <EditableField label="Title" value={offer.title} onChange={(value) => onChange({ title: value })} />
            <EditableField label="Price label" value={offer.priceLabel} onChange={(value) => onChange({ priceLabel: value })} placeholder={offer.kind === "room" ? "From IDR 750K / night" : "From IDR 75K"} />
            <EditableField label="Capacity" value={offer.capacity} onChange={(value) => onChange({ capacity: value })} type="number" placeholder="2" />
            <EditableField label="Duration" value={offer.duration} onChange={(value) => onChange({ duration: value })} placeholder={offer.kind === "room" ? "Per night" : "30 minutes"} />
            <EditableField label={canShowOnPromotions(offer) ? "Campaign badge" : "Highlight badge"} value={offer.highlight} onChange={(value) => onChange({ highlight: value })} placeholder={canShowOnPromotions(offer) ? defaultPromotionBadge : "Popular"} />
            <EditableField label="CTA label" value={offer.ctaLabel} onChange={(value) => onChange({ ctaLabel: value })} placeholder={offer.kind === "room" ? "Ask availability" : category.primaryCta} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <PresetGroup label="Price presets" options={priceLabelOptions} selected={offer.priceLabel ? [offer.priceLabel] : []} onSelect={(value) => onChange({ priceLabel: value })} />
            <PresetGroup label="Duration presets" options={durationOptions} selected={offer.duration ? [offer.duration] : []} onSelect={(value) => onChange({ duration: value })} />
            <PresetGroup label={canShowOnPromotions(offer) ? "Campaign badge presets" : "Highlight presets"} options={canShowOnPromotions(offer) ? [defaultPromotionBadge, ...highlightOptions] : highlightOptions} selected={offer.highlight ? [offer.highlight] : []} onSelect={(value) => onChange({ highlight: value })} />
            <PresetGroup label="CTA presets" options={category.ctaOptions[offer.kind]} selected={offer.ctaLabel ? [offer.ctaLabel] : []} onSelect={(value) => onChange({ ctaLabel: value })} />
          </div>
          {offer.kind === "room" ? (
            <div className="grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-950">Room details</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Optional details shown only on room cards.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectWithCustom label="Bed type" value={offer.bedType} options={bedTypeOptions} onChange={(value) => onChange({ bedType: value })} />
                <EditableField label="Room size" value={offer.roomSize} onChange={(value) => onChange({ roomSize: value })} placeholder="32 sqm" />
                <SelectWithCustom label="View type" value={offer.viewType} options={viewTypeOptions} onChange={(value) => onChange({ viewType: value })} />
                <SelectWithCustom label="Bathroom info" value={offer.bathroomInfo} options={bathroomOptions} onChange={(value) => onChange({ bathroomInfo: value })} />
                <EditableField label="Max guests" value={offer.maxGuests} onChange={(value) => onChange({ maxGuests: value })} type="number" placeholder="2" />
              </div>
              <ChipGroup label="Room amenity presets" options={roomAmenityOptions} selected={offer.roomAmenities} onToggle={(value) => onChange({ roomAmenities: toggleListValue(offer.roomAmenities, value) })} />
              <EditableField label="Room amenities, one per line" value={offer.roomAmenities.join("\n")} onChange={(value) => onChange({ roomAmenities: value.split("\n").map((item) => item.trim()).filter(Boolean) })} textarea rows={4} />
            </div>
          ) : null}
          <EditableField label="Description" value={offer.description} onChange={(value) => onChange({ description: value })} textarea />
          <ChipGroup label="Included item presets" options={category.includedOptions[offer.kind]} selected={offer.included} onToggle={(value) => onChange({ included: toggleListValue(offer.included, value) })} />
          <EditableField label="Included items, one per line" value={offer.included.join("\n")} onChange={(value) => onChange({ included: value.split("\n").map((item) => item.trim()).filter(Boolean) })} textarea rows={4} />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <input type="checkbox" checked={offer.isActive} onChange={(event) => onChange({ isActive: event.target.checked })} />
            Active
          </label>
        </div>
        <OfferCardPreview offer={offer} category={category} />
      </div>
    </div>
  );
}

function PromotionPlacementPanel({
  offer,
  onChange,
}: {
  offer: ResortOfferData;
  onChange: (patch: Partial<ResortOfferData>) => void;
}) {
  const hasPlacement = hasPromotionPlacement(offer);
  const shownOnPromotions = isShownOnPromotions(offer);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Promotions page</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Feature this {offer.kind} on the public Promotions page as a WhatsApp campaign card.
          </p>
        </div>
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-slate-50 px-4 text-xs font-semibold text-slate-950 ring-1 ring-slate-200">
          <input
            type="checkbox"
            checked={hasPlacement}
            onChange={(event) => onChange({ highlight: event.target.checked ? offer.highlight || defaultPromotionBadge : "" })}
          />
          Show on Promotions page
        </label>
      </div>
      {hasPlacement ? (
        <p className="mt-3 rounded-2xl bg-slate-100 px-3 py-2 text-xs leading-5 text-amber-700">
          {shownOnPromotions ? "This offer will appear before fallback preset items on the Promotions page." : "This offer is marked for Promotions, but it must be active before it appears publicly."}
        </p>
      ) : (
        <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          Turning this on sets a campaign badge. Clearing the badge hides it from Promotions.
        </p>
      )}
    </section>
  );
}

function OfferImagePanel({
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
    <section className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="grid gap-3 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600">
          {imageUrl ? <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} /> : "Image"}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="min-w-full">
            <h4 className="text-sm font-semibold text-slate-950">Card image</h4>
            <p className="mt-1 text-xs leading-5 text-slate-600">Used in the public offer card and preview.</p>
          </div>
          {imageUrl ? (
            <button type="button" onClick={onClear} className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
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
    </section>
  );
}

function OfferCardPreview({ offer, category }: { offer: ResortOfferData; category: ReturnType<typeof businessCategoryFromType> }) {
  const guestLabel = offer.kind === "room" ? offer.maxGuests || offer.capacity : offer.capacity;
  const capacityText = guestLabel ? `${guestLabel} ${offer.kind === "room" ? "guests" : category.capacityLabel}` : "";
  const roomDetails = offer.kind === "room"
    ? [offer.bedType, offer.roomSize, offer.viewType, offer.bathroomInfo].filter(Boolean)
    : [];

  return (
    <aside className="grid content-start gap-3 2xl:sticky 2xl:top-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Card preview</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">This updates as you edit the offer fields.</p>
      </div>
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {offer.imageUrl ? (
          <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${offer.imageUrl})` }} />
        ) : (
          <div className="flex h-24 items-center justify-center bg-slate-100 text-xs font-semibold text-slate-600">No card image</div>
        )}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">{offer.kind}</span>
            {!offer.isActive ? <span className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Inactive</span> : null}
            {isShownOnPromotions(offer) ? <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-amber-700">Promotions page</span> : null}
            {offer.highlight ? <span className="rounded-md bg-slate-950 px-3 py-1 text-xs font-semibold text-white">{offer.highlight}</span> : null}
            {capacityText ? <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-950">{capacityText}</span> : null}
            {offer.duration ? <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-950">{offer.duration}</span> : null}
            {roomDetails.map((detail) => (
              <span key={detail} className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-950">{detail}</span>
            ))}
          </div>
          <h4 className="mt-4 text-xl font-semibold text-slate-950">{offer.title || "Untitled offer"}</h4>
          {offer.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{offer.description}</p> : null}
          {offer.included.length > 0 ? (
            <ul className="mt-4 grid gap-2 text-sm text-slate-600">
              {offer.included.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {offer.kind === "room" && offer.roomAmenities.length > 0 ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Room amenities</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {offer.roomAmenities.map((amenity) => (
                  <span key={amenity} className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">{amenity}</span>
                ))}
              </div>
            </div>
          ) : null}
          {offer.priceLabel ? <p className="mt-4 text-sm font-semibold text-slate-950">{offer.priceLabel}</p> : null}
          <span className="mt-4 inline-flex min-h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white">
            {offer.ctaLabel || (offer.kind === "room" ? "Ask availability" : category.primaryCta)}
          </span>
        </div>
      </article>
    </aside>
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
    <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
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
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      {textarea ? (
        <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-600" />
      ) : (
        <input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600" />
      )}
    </label>
  );
}

function SelectWithCustom({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const isPreset = !value || options.includes(value);
  const selectValue = isPreset ? value : "__custom";

  return (
    <div className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      <select
        value={selectValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue === "__custom" ? value : nextValue);
        }}
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
        <option value="__custom">Custom</option>
      </select>
      {selectValue === "__custom" ? (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Custom ${label.toLowerCase()}`} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600" />
      ) : null}
    </div>
  );
}

function PresetGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`rounded-md px-3 py-1 text-xs font-semibold ring-1 ${selected.includes(option) ? "bg-slate-950 text-white ring-slate-950" : "bg-slate-50 text-slate-950 ring-slate-200"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-md px-3 py-1 text-xs font-semibold ring-1 ${isSelected ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-950 ring-slate-200"}`}
            >
              {isSelected ? "✓ " : "+ "}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
