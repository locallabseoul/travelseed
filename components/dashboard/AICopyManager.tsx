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
  type DraftField,
} from "@/components/dashboard/SetupDraftTools";
import { dashboardCategoryCopyFor } from "@/lib/dashboard-category-copy";
import type { DashboardUnsavedChanges, ResortConsoleData } from "@/types/dashboard";

const contentOnlyFields: DraftField[] = [
  "heroTitle",
  "heroSubtitle",
  "about",
  "features",
  "experiences",
  "bookingMessageTemplate",
];

export function AICopyManager({
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
  const dashboardCopy = dashboardCategoryCopyFor(site);
  const { draft, selectedFields, setNextDraft, clearDraft, toggleDraftField } = useSelectableDraft();

  useDraftDirtyGuard({
    draft,
    onUnsavedChangesChange,
    title: "Discard AI copy suggestions?",
    description: "You have generated copy suggestions that have not been saved. Continue without saving them?",
  });

  async function generateDraft() {
    setGenerating(true);
    setStatus("Generating WhatsApp-ready copy pack...");

    try {
      const data = await operatorFetch(`/api/operator/resorts/${site.id}/setup/generate`, {
        method: "POST",
        body: JSON.stringify({
          mode: "brand_copy",
          sourceUrl,
          existingText,
        }),
      }) as { draft?: Record<string, unknown>; warning?: string };
      const nextDraft = draftFromApiDraft(data.draft ?? {}, contentOnlyFields);
      setNextDraft(nextDraft);
      setStatus(data.warning ?? "Copy pack ready. Review suggested changes before applying.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not generate brand copy.");
    } finally {
      setGenerating(false);
    }
  }

  async function applySelectedDraft() {
    await onSiteUpdate(applyDraftToSite(site, draft, selectedFields));
    clearDraft();
    setStatus("Selected AI copy fields saved.");
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">AI Copy</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">AI Brand Copy</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Generate a WhatsApp-ready copy pack for hero, about, business highlights, services, and inquiry message text.</p>
          </div>
          <Badge tone="sand">Setup step 4</Badge>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-xl font-semibold text-slate-950">Copy pack output</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["Hero", "About", "Business highlights", dashboardCopy.pages.offersLabel, "WhatsApp message"].map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">{item}</div>
          ))}
        </div>
      </Panel>

      <SourceGenerator
        sourceUrl={sourceUrl}
        existingText={existingText}
        generating={generating}
        buttonLabel="Generate copy pack"
        helper="Optional: add a public business link or paste notes to give the AI more context. It will not generate offer inventory or SEO metadata in this version."
        onSourceUrlChange={setSourceUrl}
        onExistingTextChange={setExistingText}
        onGenerate={() => void generateDraft()}
      />

      <DraftReview site={site} draft={draft} selectedFields={selectedFields} onToggleField={toggleDraftField} onApply={() => void applySelectedDraft()} />

      {status ? <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">{status}</p> : null}
    </div>
  );
}
