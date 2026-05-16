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
import type { DashboardUnsavedChanges, ResortConsoleData } from "@/types/dashboard";

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

  useDraftDirtyGuard({
    draft,
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
      }) as { draft?: Record<string, unknown>; warning?: string };
      const nextDraft = draftFromApiDraft(data.draft ?? {});
      setNextDraft(nextDraft);
      setStatus(data.warning ?? "Draft ready. Review suggested changes before applying.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import this source.");
    } finally {
      setGenerating(false);
    }
  }

  async function applySelectedDraft() {
    await onSiteUpdate(applyDraftToSite(site, draft, selectedFields));
    clearDraft();
    setStatus("Selected imported fields saved.");
  }

  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">Import</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">OTA / existing info</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Bring over a public listing or existing property notes, then choose which suggested fields to save.</p>
          </div>
          <Badge tone="sand">Setup step 2</Badge>
        </div>
      </Panel>

      <SourceGenerator
        sourceUrl={sourceUrl}
        existingText={existingText}
        generating={generating}
        helper="Use a public Booking, Airbnb, Agoda, or property listing URL. If a listing is unavailable, paste existing descriptions, facilities, and local area notes."
        onSourceUrlChange={setSourceUrl}
        onExistingTextChange={setExistingText}
        onGenerate={() => void generateDraft()}
      />

      <DraftReview site={site} draft={draft} selectedFields={selectedFields} onToggleField={toggleDraftField} onApply={() => void applySelectedDraft()} />

      {status ? <p className="rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#52615a] ring-1 ring-[#eadfce]">{status}</p> : null}
    </div>
  );
}
