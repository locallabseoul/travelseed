"use client";

import { useEffect, useState } from "react";
import { Badge, Panel } from "@/components/dashboard/ui";
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

const offerSections: Array<{
  kind: ResortOfferData["kind"];
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

const bedTypeOptions = ["King bed", "Queen bed", "Twin beds", "Double bed", "Bunk beds", "Sofa bed", "Mixed beds"];
const viewTypeOptions = ["Ocean view", "Garden view", "Pool view", "Mountain view", "Rice field view", "Courtyard view", "No view / Interior"];
const bathroomOptions = ["Private bathroom", "Shared bathroom", "Ensuite bathroom", "Outdoor bathroom", "Bathtub", "Shower only"];
const durationOptions = ["Per night", "2 nights", "3 days / 2 nights", "Half day", "Full day"];
const highlightOptions = ["Best value", "Popular", "Limited offer", "Family friendly", "Private", "New"];
const priceLabelOptions = ["From IDR ...", "Per night", "Per person", "Per package", "Contact for price"];
const roomAmenityOptions = ["Air conditioning", "WiFi", "Hot water", "Private balcony", "Mini fridge", "Safe", "Desk", "Wardrobe", "Coffee/tea", "Smart TV"];
const defaultPromotionBadge = "Direct booking offer";

const ctaOptions: Record<ResortOfferData["kind"], string[]> = {
  room: ["Check availability", "Ask room availability", "Book this room"],
  package: ["Ask about this package", "Reserve package", "Plan my stay"],
  service: ["Request service", "Ask details", "Book service"],
};

const includedOptions: Record<ResortOfferData["kind"], string[]> = {
  room: ["Breakfast", "Daily housekeeping", "Pool access", "WiFi"],
  package: ["Accommodation", "Breakfast", "Airport pickup", "Activity", "Guide"],
  service: ["Equipment", "Instructor", "Transport", "Insurance", "Refreshment"],
};

const starterPresets: Record<ResortOfferData["kind"], Array<{
  label: string;
  patch: Partial<ResortOfferData>;
}>> = {
  room: [
    { label: "Private Room", patch: { title: "Private Room", ctaLabel: "Check availability", highlight: "Private", included: ["WiFi", "Daily housekeeping"], bedType: "Queen bed", bathroomInfo: "Private bathroom", maxGuests: "2" } },
    { label: "Family Room", patch: { title: "Family Room", ctaLabel: "Ask room availability", highlight: "Family friendly", included: ["Breakfast", "WiFi"], bedType: "Mixed beds", bathroomInfo: "Private bathroom", maxGuests: "4" } },
    { label: "Villa", patch: { title: "Private Villa", ctaLabel: "Book this room", highlight: "Private", included: ["Breakfast", "Pool access", "WiFi"], bedType: "King bed", bathroomInfo: "Ensuite bathroom", maxGuests: "2" } },
    { label: "Dorm Bed", patch: { title: "Dorm Bed", ctaLabel: "Check availability", highlight: "Best value", included: ["WiFi", "Shared bathroom"], bedType: "Bunk beds", bathroomInfo: "Shared bathroom", maxGuests: "1" } },
  ],
  package: [
    { label: "Stay Package", patch: { title: "Stay Package", ctaLabel: "Ask about this package", highlight: "Best value", included: ["Accommodation", "Breakfast"] } },
    { label: "Honeymoon Package", patch: { title: "Honeymoon Package", ctaLabel: "Reserve package", highlight: "Limited offer", included: ["Accommodation", "Breakfast", "Airport pickup"] } },
    { label: "Surf Camp", patch: { title: "Surf Camp", ctaLabel: "Plan my stay", highlight: "Popular", duration: "3 days / 2 nights", included: ["Accommodation", "Breakfast", "Activity", "Guide"] } },
    { label: "Retreat", patch: { title: "Retreat Package", ctaLabel: "Ask about this package", highlight: "New", included: ["Accommodation", "Breakfast", "Activity"] } },
  ],
  service: [
    { label: "Airport Pickup", patch: { title: "Airport Pickup", ctaLabel: "Request service", duration: "One way", included: ["Transport"] } },
    { label: "Surf Lesson", patch: { title: "Surf Lesson", ctaLabel: "Book service", highlight: "Popular", duration: "Half day", included: ["Instructor", "Equipment"] } },
    { label: "Scooter Rental", patch: { title: "Scooter Rental", ctaLabel: "Ask details", duration: "Full day", included: ["Equipment"] } },
    { label: "Island Tour", patch: { title: "Island Tour", ctaLabel: "Book service", duration: "Full day", included: ["Transport", "Guide", "Refreshment"] } },
  ],
};

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
      description: "You have room, package, or service changes that have not been saved. Continue without saving them?",
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Offers</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Rooms, packages & services</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">
              Manage the bookable offers that appear on your direct booking site. Keep content structured so guests can scan and inquire quickly.
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
            <h2 className="text-xl font-semibold text-[#18352f]">Offer inventory</h2>
            <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Add rooms for stays, packages for bundled offers, and services for add-ons or local businesses.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void generateSampleOffers()} disabled={generating} className="min-h-10 rounded-full bg-[#18352f] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
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
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={() => void saveOffers()} disabled={saving} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving..." : "Save offers"}
          </button>
          {status ? <p className="rounded-2xl bg-[#fbfaf7] px-4 py-3 text-sm leading-6 text-[#52615a]">{status}</p> : null}
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
  offers,
  selectedIndex,
  onAdd,
  onSelect,
  onMove,
  onRemove,
}: {
  section: (typeof offerSections)[number];
  offers: Array<{ offer: ResortOfferData; index: number }>;
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
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#72815e] ring-1 ring-[#eadfce]">{offers.length}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#6f7b74]">{section.description}</p>
        </div>
        <button type="button" onClick={onAdd} className="min-h-9 rounded-full bg-white px-3 text-xs font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
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
        <div className="rounded-2xl border border-dashed border-[#d8cebb] bg-white p-4">
          <p className="text-sm font-semibold text-[#18352f]">{section.emptyTitle}</p>
          <p className="mt-1 text-xs leading-5 text-[#6f7b74]">{section.emptyDescription}</p>
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
    <article className={`grid grid-cols-[88px_minmax(0,1fr)] gap-3 rounded-2xl border p-2 transition ${selected ? "border-[#18352f] bg-white shadow-sm" : "border-[#eadfce] bg-white/75"}`}>
      <button type="button" onClick={onSelect} className="aspect-square overflow-hidden rounded-xl bg-[#eadfce] text-left">
        {offer.imageUrl ? <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${offer.imageUrl})` }} /> : null}
      </button>
      <div className="min-w-0">
        <button type="button" onClick={onSelect} className="block w-full text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e6f0e7] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#1f5a45]">{offer.kind}</span>
            {!offer.isActive ? <span className="rounded-full bg-[#fff7f5] px-2 py-0.5 text-[11px] font-semibold text-[#9d3323]">Inactive</span> : null}
            {isShownOnPromotions(offer) ? <span className="rounded-full bg-[#f1eadc] px-2 py-0.5 text-[11px] font-semibold text-[#7b5b24]">Promotions page</span> : null}
          </div>
          <h4 className="mt-2 truncate text-sm font-semibold text-[#18352f]">{offer.title || "Untitled item"}</h4>
          <p className="mt-1 truncate text-xs text-[#6f7b74]">{offer.priceLabel || offer.duration || offer.highlight || "No details yet"}</p>
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

function OfferDetailEditor({
  offer,
  index,
  uploading,
  onChange,
  onUploadImage,
}: {
  offer: ResortOfferData;
  index: number;
  uploading: boolean;
  onChange: (patch: Partial<ResortOfferData>) => void;
  onUploadImage: (file: File) => void;
}) {
  return (
    <div className="grid content-start gap-4 rounded-2xl border border-[#eadfce] bg-[#fbfaf7] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#72815e]">Editing offer {index + 1}</p>
          <h3 className="mt-1 text-xl font-semibold text-[#18352f]">{offer.title || "Untitled item"}</h3>
        </div>
        <select
          value={offer.kind}
          onChange={(event) => onChange({ kind: event.target.value as ResortOfferData["kind"] })}
          className="min-h-10 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]"
        >
          <option value="room">Room</option>
          <option value="package">Package</option>
          <option value="service">Service</option>
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
            options={starterPresets[offer.kind].map((preset) => preset.label)}
            selected={[]}
            onSelect={(label) => {
              const preset = starterPresets[offer.kind].find((item) => item.label === label);
              if (preset) {
                onChange(preset.patch);
              }
            }}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <EditableField label="Title" value={offer.title} onChange={(value) => onChange({ title: value })} />
            <EditableField label="Price label" value={offer.priceLabel} onChange={(value) => onChange({ priceLabel: value })} placeholder="From IDR 750K / night" />
            <EditableField label="Capacity" value={offer.capacity} onChange={(value) => onChange({ capacity: value })} type="number" placeholder="2" />
            <EditableField label="Duration" value={offer.duration} onChange={(value) => onChange({ duration: value })} placeholder="Per night" />
            <EditableField label={canShowOnPromotions(offer) ? "Campaign badge" : "Highlight badge"} value={offer.highlight} onChange={(value) => onChange({ highlight: value })} placeholder={canShowOnPromotions(offer) ? defaultPromotionBadge : "Popular"} />
            <EditableField label="CTA label" value={offer.ctaLabel} onChange={(value) => onChange({ ctaLabel: value })} placeholder="Ask availability" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <PresetGroup label="Price presets" options={priceLabelOptions} selected={offer.priceLabel ? [offer.priceLabel] : []} onSelect={(value) => onChange({ priceLabel: value })} />
            <PresetGroup label="Duration presets" options={durationOptions} selected={offer.duration ? [offer.duration] : []} onSelect={(value) => onChange({ duration: value })} />
            <PresetGroup label={canShowOnPromotions(offer) ? "Campaign badge presets" : "Highlight presets"} options={canShowOnPromotions(offer) ? [defaultPromotionBadge, ...highlightOptions] : highlightOptions} selected={offer.highlight ? [offer.highlight] : []} onSelect={(value) => onChange({ highlight: value })} />
            <PresetGroup label="CTA presets" options={ctaOptions[offer.kind]} selected={offer.ctaLabel ? [offer.ctaLabel] : []} onSelect={(value) => onChange({ ctaLabel: value })} />
          </div>
          {offer.kind === "room" ? (
            <div className="grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-[#eadfce]">
              <div>
                <p className="text-sm font-semibold text-[#18352f]">Room details</p>
                <p className="mt-1 text-xs leading-5 text-[#6f7b74]">Optional details shown only on room cards.</p>
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
          <ChipGroup label="Included item presets" options={includedOptions[offer.kind]} selected={offer.included} onToggle={(value) => onChange({ included: toggleListValue(offer.included, value) })} />
          <EditableField label="Included items, one per line" value={offer.included.join("\n")} onChange={(value) => onChange({ included: value.split("\n").map((item) => item.trim()).filter(Boolean) })} textarea rows={4} />
          <label className="flex items-center gap-2 text-sm font-semibold text-[#18352f]">
            <input type="checkbox" checked={offer.isActive} onChange={(event) => onChange({ isActive: event.target.checked })} />
            Active
          </label>
        </div>
        <OfferCardPreview offer={offer} />
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
    <section className="rounded-2xl border border-[#eadfce] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#18352f]">Promotions page</p>
          <p className="mt-1 text-xs leading-5 text-[#6f7b74]">
            Feature this {offer.kind} on the public Promotions page as a direct-booking campaign card.
          </p>
        </div>
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-[#fbfaf7] px-4 text-xs font-semibold text-[#18352f] ring-1 ring-[#eadfce]">
          <input
            type="checkbox"
            checked={hasPlacement}
            onChange={(event) => onChange({ highlight: event.target.checked ? offer.highlight || defaultPromotionBadge : "" })}
          />
          Show on Promotions page
        </label>
      </div>
      {hasPlacement ? (
        <p className="mt-3 rounded-2xl bg-[#f1eadc] px-3 py-2 text-xs leading-5 text-[#7b5b24]">
          {shownOnPromotions ? "This offer will appear before fallback preset items on the Promotions page." : "This offer is marked for Promotions, but it must be active before it appears publicly."}
        </p>
      ) : (
        <p className="mt-3 rounded-2xl bg-[#fbfaf7] px-3 py-2 text-xs leading-5 text-[#6f7b74]">
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
    <section className="rounded-2xl border border-[#eadfce] bg-white p-3">
      <div className="grid gap-3 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-[#eadfce] bg-[#fbfaf7] text-xs text-[#6f7b74]">
          {imageUrl ? <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} /> : "Image"}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="min-w-full">
            <h4 className="text-sm font-semibold text-[#18352f]">Card image</h4>
            <p className="mt-1 text-xs leading-5 text-[#6f7b74]">Used in the public offer card and preview.</p>
          </div>
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
    </section>
  );
}

function OfferCardPreview({ offer }: { offer: ResortOfferData }) {
  const guestLabel = offer.kind === "room" ? offer.maxGuests || offer.capacity : offer.capacity;
  const roomDetails = offer.kind === "room"
    ? [offer.bedType, offer.roomSize, offer.viewType, offer.bathroomInfo].filter(Boolean)
    : [];

  return (
    <aside className="grid content-start gap-3 2xl:sticky 2xl:top-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#72815e]">Card preview</p>
        <p className="mt-1 text-xs leading-5 text-[#6f7b74]">This updates as you edit the offer fields.</p>
      </div>
      <article className="overflow-hidden rounded-2xl border border-[#eadfce] bg-white shadow-sm">
        {offer.imageUrl ? (
          <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${offer.imageUrl})` }} />
        ) : (
          <div className="flex h-24 items-center justify-center bg-[#eadfce] text-xs font-semibold text-[#6f7b74]">No card image</div>
        )}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e6f0e7] px-3 py-1 text-xs font-semibold capitalize text-[#1f5a45]">{offer.kind}</span>
            {!offer.isActive ? <span className="rounded-full bg-[#fff7f5] px-3 py-1 text-xs font-semibold text-[#9d3323]">Inactive</span> : null}
            {isShownOnPromotions(offer) ? <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold text-[#7b5b24]">Promotions page</span> : null}
            {offer.highlight ? <span className="rounded-full bg-[#18352f] px-3 py-1 text-xs font-semibold text-white">{offer.highlight}</span> : null}
            {guestLabel ? <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold text-[#18352f]">{guestLabel} guests</span> : null}
            {offer.duration ? <span className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold text-[#18352f]">{offer.duration}</span> : null}
            {roomDetails.map((detail) => (
              <span key={detail} className="rounded-full bg-[#f1eadc] px-3 py-1 text-xs font-semibold text-[#18352f]">{detail}</span>
            ))}
          </div>
          <h4 className="mt-4 text-xl font-semibold text-[#18352f]">{offer.title || "Untitled offer"}</h4>
          {offer.description ? <p className="mt-3 text-sm leading-6 text-[#6f7b74]">{offer.description}</p> : null}
          {offer.included.length > 0 ? (
            <ul className="mt-4 grid gap-2 text-sm text-[#536159]">
              {offer.included.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#6f7f57]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {offer.kind === "room" && offer.roomAmenities.length > 0 ? (
            <div className="mt-4 rounded-2xl bg-[#fbfaf7] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7f57]">Room amenities</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {offer.roomAmenities.map((amenity) => (
                  <span key={amenity} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#536159] ring-1 ring-[#eadfce]">{amenity}</span>
                ))}
              </div>
            </div>
          ) : null}
          {offer.priceLabel ? <p className="mt-4 text-sm font-semibold text-[#18352f]">{offer.priceLabel}</p> : null}
          <span className="mt-4 inline-flex min-h-10 items-center rounded-full bg-[#18352f] px-4 text-sm font-semibold text-white">
            {offer.ctaLabel || "Ask availability"}
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
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      {textarea ? (
        <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
      ) : (
        <input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
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
    <div className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      <select
        value={selectValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue === "__custom" ? value : nextValue);
        }}
        className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
        <option value="__custom">Custom</option>
      </select>
      {selectValue === "__custom" ? (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Custom ${label.toLowerCase()}`} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
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
    <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadfce]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#72815e]">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${selected.includes(option) ? "bg-[#18352f] text-white ring-[#18352f]" : "bg-[#fbfaf7] text-[#18352f] ring-[#eadfce]"}`}
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
    <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadfce]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#72815e]">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${isSelected ? "bg-[#e6f0e7] text-[#1f5a45] ring-[#9eb39f]" : "bg-[#fbfaf7] text-[#18352f] ring-[#eadfce]"}`}
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
