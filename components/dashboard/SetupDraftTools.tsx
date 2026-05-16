import { useEffect, useState } from "react";
import { Panel } from "@/components/dashboard/ui";
import type { DashboardUnsavedChanges, ResortConsoleData } from "@/types/dashboard";

export type DraftField = "name" | "location" | "type" | "template" | "heroTitle" | "heroSubtitle" | "about" | "features" | "experiences" | "bookingMessageTemplate";
export type SetupDraft = Partial<Record<DraftField, string | string[]>>;

const draftFieldLabels: Record<DraftField, string> = {
  name: "Business name",
  location: "Location",
  type: "Business type",
  template: "Template",
  heroTitle: "Hero title",
  heroSubtitle: "Hero subtitle",
  about: "About copy",
  features: "Features",
  experiences: "Experiences",
  bookingMessageTemplate: "WhatsApp message",
};

function listValue(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function draftFromApiDraft(value: Record<string, unknown>, allowedFields?: DraftField[]): SetupDraft {
  const draft: SetupDraft = {
    name: stringValue(value.name),
    location: stringValue(value.location),
    type: stringValue(value.type),
    template: stringValue(value.template_id),
    heroTitle: stringValue(value.hero_title),
    heroSubtitle: stringValue(value.hero_subtitle),
    about: stringValue(value.description),
    features: listValue(value.features),
    experiences: listValue(value.experiences),
    bookingMessageTemplate: stringValue(value.booking_message_template),
  };
  const compact = Object.fromEntries(
    Object.entries(draft).filter((entry): entry is [DraftField, string | string[]] => {
      const [field, value] = entry as [DraftField, string | string[]];
      const allowed = allowedFields ? allowedFields.includes(field) : true;
      const present = Array.isArray(value) ? value.length > 0 : Boolean(value);
      return allowed && present;
    }),
  ) as SetupDraft;

  return compact;
}

export function applyDraftToSite(site: ResortConsoleData, draft: SetupDraft, selectedFields: Set<DraftField>) {
  const nextSite = { ...site };

  selectedFields.forEach((field) => {
    const value = draft[field];
    if (!value) {
      return;
    }

    switch (field) {
      case "name":
        nextSite.name = String(value);
        break;
      case "location":
        nextSite.location = String(value);
        break;
      case "type":
        nextSite.type = String(value);
        break;
      case "template":
        nextSite.template = String(value);
        break;
      case "heroTitle":
        nextSite.heroTitle = String(value);
        break;
      case "heroSubtitle":
        nextSite.heroSubtitle = String(value);
        break;
      case "about":
        nextSite.about = String(value);
        break;
      case "features":
        nextSite.features = Array.isArray(value) ? value : [];
        break;
      case "experiences":
        nextSite.experiences = Array.isArray(value) ? value : [];
        break;
      case "bookingMessageTemplate":
        nextSite.bookingMessageTemplate = String(value);
        break;
    }
  });

  return nextSite;
}

function valueForField(site: ResortConsoleData, field: DraftField) {
  if (field === "template") {
    return site.template;
  }

  return site[field];
}

function formatDraftValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.join("\n");
  }

  return value ?? "";
}

export function useDraftDirtyGuard({
  draft,
  onUnsavedChangesChange,
  title,
  description,
}: {
  draft: SetupDraft;
  onUnsavedChangesChange?: (state: DashboardUnsavedChanges) => void;
  title: string;
  description: string;
}) {
  const isDirty = Object.keys(draft).length > 0;

  useEffect(() => {
    onUnsavedChangesChange?.({ isDirty, title, description });
    return () => onUnsavedChangesChange?.({ isDirty: false, title: "", description: "" });
  }, [description, isDirty, onUnsavedChangesChange, title]);
}

export function SourceGenerator({
  sourceUrl,
  existingText,
  generating,
  buttonLabel = "Generate draft",
  helper,
  onSourceUrlChange,
  onExistingTextChange,
  onGenerate,
}: {
  sourceUrl: string;
  existingText: string;
  generating: boolean;
  buttonLabel?: string;
  helper: string;
  onSourceUrlChange: (value: string) => void;
  onExistingTextChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <Panel>
      <h2 className="text-xl font-semibold text-[#18352f]">Source information</h2>
      <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{helper}</p>
      <div className="mt-5 grid gap-4">
        <EditableField label="OTA listing URL" value={sourceUrl} onChange={onSourceUrlChange} placeholder="https://www.booking.com/hotel/..." />
        <EditableField label="Existing info" value={existingText} onChange={onExistingTextChange} textarea rows={7} placeholder="Paste existing descriptions, amenities, local area notes, or old website copy." />
        <button type="button" onClick={onGenerate} disabled={generating} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {generating ? "Generating..." : buttonLabel}
        </button>
      </div>
    </Panel>
  );
}

export function DraftReview({
  site,
  draft,
  selectedFields,
  onToggleField,
  onApply,
}: {
  site: ResortConsoleData;
  draft: SetupDraft;
  selectedFields: Set<DraftField>;
  onToggleField: (field: DraftField) => void;
  onApply: () => void;
}) {
  const fields = Object.keys(draft) as DraftField[];

  if (fields.length === 0) {
    return null;
  }

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#18352f]">Review suggested changes</h2>
          <p className="mt-1 text-sm leading-6 text-[#6f7b74]">Select the fields you want to apply to the current site.</p>
        </div>
        <button type="button" onClick={onApply} disabled={selectedFields.size === 0} className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          Save selected changes
        </button>
      </div>
      <div className="mt-5 grid gap-3">
        {fields.map((field) => (
          <label key={field} className="grid gap-3 rounded-2xl bg-[#fbfaf7] p-4 ring-1 ring-[#eadfce]">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={selectedFields.has(field)} onChange={() => onToggleField(field)} className="h-4 w-4 accent-[#2d6b50]" />
              <span className="text-sm font-semibold text-[#18352f]">{draftFieldLabels[field]}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyBlock label="Current" value={formatDraftValue(valueForField(site, field) as string | string[])} />
              <ReadOnlyBlock label="Suggested" value={formatDraftValue(draft[field])} />
            </div>
          </label>
        ))}
      </div>
    </Panel>
  );
}

export function useSelectableDraft(initialDraft: SetupDraft = {}) {
  const [draft, setDraft] = useState<SetupDraft>(initialDraft);
  const [selectedFields, setSelectedFields] = useState<Set<DraftField>>(new Set());

  function setNextDraft(nextDraft: SetupDraft) {
    setDraft(nextDraft);
    setSelectedFields(new Set(Object.keys(nextDraft) as DraftField[]));
  }

  function clearDraft() {
    setDraft({});
    setSelectedFields(new Set());
  }

  function toggleDraftField(field: DraftField) {
    setSelectedFields((current) => {
      const next = new Set(current);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }

  return { draft, selectedFields, setNextDraft, clearDraft, toggleDraftField };
}

function EditableField({
  label,
  value,
  onChange,
  textarea,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      {textarea ? (
        <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-xl border border-[#d8cebb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#18352f]" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 rounded-xl border border-[#d8cebb] bg-white px-3 text-sm outline-none focus:border-[#18352f]" />
      )}
    </label>
  );
}

function ReadOnlyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#72815e]">{label}</p>
      <pre className="mt-2 min-h-20 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm leading-6 text-[#52615a]">{value || "Empty"}</pre>
    </div>
  );
}
