"use client";

import { useState } from "react";
import { Badge, Panel } from "@/components/dashboard/ui";
import {
  applyDraftToSite,
  draftFromApiDraft,
  DraftReview,
  SourceGenerator,
  useDraftDirtyGuard,
  useSelectableDraft,
} from "@/components/dashboard/SetupDraftTools";
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

function draftOfferFromApi(offer: GeneratedOfferResponse, index: number, baseOrder: number): ResortOfferData {
  return {
    id: `draft-import-${Date.now()}-${index}`,
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
    sortOrder: baseOrder + index,
    isActive: true,
  };
}

export function ImportManager({
  site,
  operatorFetch,
  onSiteUpdate,
  onUnsavedChangesChange,
}: {
  site: ResortConsoleData;
  operatorFetch: (path: string, init?: RequestInit) => Promise<unknown>;
  onSiteUpdate: (site: ResortConsoleData) => Promise<void>;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
}) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [existingText, setExistingText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const { draft, selectedFields, setNextDraft, clearDraft, toggleDraftField } = useSelectableDraft();
  const [serviceDrafts, setServiceDrafts] = useState<ResortOfferData[]>([]);
  const [selectedServiceDraftIds, setSelectedServiceDraftIds] = useState<Set<string>>(new Set());

  useDraftDirtyGuard({
    draft: Object.keys(draft).length > 0 || serviceDrafts.length > 0 ? { ...draft, features: serviceDrafts.map((service) => service.title) } : draft,
    onUnsavedChangesChange,
    title: "Discard imported suggestions?",
    description: "You have imported setup suggestions that have not been saved. Continue without saving them?",
  });

  async function generateDraft() {
    setGenerating(true);
    setStatus("Reading source information...");

    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/setup/generate`, {
        method: "POST",
        body: JSON.stringify({
          mode: "import_listing",
          sourceUrl,
          existingText,
        }),
      }) as { draft?: Record<string, unknown>; servicesDraft?: GeneratedOfferResponse[]; warning?: string };
      const nextDraft = draftFromApiDraft(data.draft ?? {});
      const nextServiceDrafts = (data.servicesDraft ?? []).map((offer, index) => draftOfferFromApi(offer, index, site.services.length));
      setNextDraft(nextDraft);
      setServiceDrafts(nextServiceDrafts);
      setSelectedServiceDraftIds(new Set(nextServiceDrafts.map((offer) => offer.id)));
      setStatus(data.warning ?? `Draft ready${nextServiceDrafts.length ? ` with ${nextServiceDrafts.length} suggested offer items` : ""}. Review suggested changes before applying.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import this source.");
    } finally {
      setGenerating(false);
    }
  }

  async function applySelectedDraft() {
    const selectedServiceDrafts = serviceDrafts.filter((service) => selectedServiceDraftIds.has(service.id));
    const nextSite = applyDraftToSite(site, draft, selectedFields);

    if (selectedServiceDrafts.length > 0) {
      const combinedServices = [...site.services, ...selectedServiceDrafts].map((offer, index) => ({ ...offer, sortOrder: index }));
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/services`, {
        method: "PUT",
        body: JSON.stringify({
          services: combinedServices.map((offer, index) => ({
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
      }) as { services?: ResortOffer[] };
      nextSite.services = ((data.services ?? []) as ResortOffer[]).map(offerFromApi);
    }

    await onSiteUpdate(nextSite);
    clearDraft();
    setServiceDrafts([]);
    setSelectedServiceDraftIds(new Set());
    setStatus("Selected imported fields saved.");
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Import</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Existing business source</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Bring over a public website, Instagram, marketplace, OTA, or existing business notes, then choose which suggested fields to save.</p>
          </div>
          <Badge tone="sand">Setup step 2</Badge>
        </div>
      </Panel>

      <SourceGenerator
        sourceUrl={sourceUrl}
        existingText={existingText}
        generating={generating}
        helper="Use a public website, Instagram, marketplace, Booking, Airbnb, Agoda, or social link. If a link is unavailable, paste existing descriptions, services, offers, and operating notes."
        onSourceUrlChange={setSourceUrl}
        onExistingTextChange={setExistingText}
        onGenerate={() => void generateDraft()}
      />

      <DraftReview site={site} draft={draft} selectedFields={selectedFields} onToggleField={toggleDraftField} onApply={() => void applySelectedDraft()} />
      <ServiceDraftReview
        services={serviceDrafts}
        selectedIds={selectedServiceDraftIds}
        onSelectionChange={setSelectedServiceDraftIds}
        onApply={() => void applySelectedDraft()}
      />

      {status ? <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">{status}</p> : null}
    </div>
  );
}

function ServiceDraftReview({
  services,
  selectedIds,
  onSelectionChange,
  onApply,
}: {
  services: ResortOfferData[];
  selectedIds: Set<string>;
  onSelectionChange: (value: Set<string>) => void;
  onApply: () => void;
}) {
  if (services.length === 0) {
    return null;
  }

  function toggleService(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  }

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Review suggested offer items</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Selected services, packages, rooms, products, or menu items will be added to the current offer inventory.</p>
        </div>
        <button type="button" onClick={onApply} disabled={selectedIds.size === 0} className="min-h-11 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          Save selected items
        </button>
      </div>
      <div className="mt-5 grid gap-3">
        {services.map((service) => (
          <label key={service.id} className="grid gap-2 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={selectedIds.has(service.id)} onChange={() => toggleService(service.id)} className="mt-1 h-4 w-4 accent-emerald-600" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold capitalize text-emerald-700 ring-1 ring-slate-200">{service.kind}</span>
                  {service.priceLabel ? <span className="text-xs font-medium text-slate-600">{service.priceLabel}</span> : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">{service.title}</p>
                {service.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{service.description}</p> : null}
                {service.included.length > 0 ? <p className="mt-1 text-xs text-slate-600">{service.included.join(" · ")}</p> : null}
              </div>
            </div>
          </label>
        ))}
      </div>
    </Panel>
  );
}
